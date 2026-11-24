#!/usr/bin/env python3
"""Gera os sprites 9-slice (molduras pixel art) da HUD do Bit Survival.

Saida: css/sprites-hud.css, com variaveis CSS do tipo --hs-<variante>-<borda><u|d> contendo um PNG embutido (data URI).
Nada para baixar e nada para desenhar em JavaScript: a HUD continua funcionando offline (APK, navegador sem internet).

Uso: python3 tools/gerar-sprites-hud.py   (so biblioteca padrao do Python)

Linguagem visual (a mesma para TODOS os componentes da HUD):
- moldura em camadas: contorno marrom-escuro (nunca preto) -> bisel claro em cima/esquerda e escuro embaixo/direita -> faixa de cor ->
  miolo (poco) verde-musgo escuro onde ficam os icones;
- cantos recortados em degrau (1 ou 2 pixels), nada de circulo;
- rebites claros nos cantos das molduras largas (acabamento artesanal);
- variantes por funcao: wood (neutro), moss (interagir), blood (atacar), gold (selecionado/ativo), grey (indisponivel), night (placa de aviso de estado);
- 'u' = em repouso, 'd' = pressionado (bisel invertido, cores mais escuras).
O tamanho da moldura em tela e sempre (borda x --hu), onde --hu e o pixel da HUD ajustado ao pixel fisico da tela (ver applyUiScale em js/01-base.js).
"""
import base64
import os
import struct
import zlib

INK = '#1f140c'
VARIANTES = {
    #            bisel claro  faixa       bisel escuro  miolo
    'wood':  dict(hi='#cf9a5e', band='#8a5a2a', lo='#4a2e16', well='#46573a'),
    'moss':  dict(hi='#c3da92', band='#628442', lo='#33472a', well='#46573a'),
    'blood': dict(hi='#f59a76', band='#b5301f', lo='#661810', well='#5a2a20'),
    'gold':  dict(hi='#ffe066', band='#e3ad32', lo='#b8741a', well='#5a5a30'),
    'grey':  dict(hi='#a9a28c', band='#6e695a', lo='#3d3a31', well='#30352a'),
    'night': dict(hi='#b88a58', band='#7a5230', lo='#3f2813', well='#2b2018'),   # placas de aviso de estado (miolo escuro para o texto colorido)
}
# (largura da borda em pixels da arte, recorte do canto em pixels)
TAMANHOS = {2: 1, 3: 2, 4: 3}


def hex_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def escurece(h, f):
    r, g, b = hex_rgb(h)
    return '#%02x%02x%02x' % (int(r * f), int(g * f), int(b * f))


def mistura(a, b):
    ra, rb = hex_rgb(a), hex_rgb(b)
    return '#%02x%02x%02x' % tuple((x + y) // 2 for x, y in zip(ra, rb))


def paleta(v, pressionado):
    p = dict(VARIANTES[v])
    if pressionado:
        # bisel invertido (o botao afundou) e cores um pouco mais escuras
        p['hi'], p['lo'] = escurece(p['lo'], 1.0), p['hi']
        p['hi'] = escurece(p['hi'], .8)
        p['lo'] = escurece(p['lo'], .75)
        p['band'] = escurece(p['band'], .78)
        p['well'] = escurece(p['well'], .82)
    return p


def moldura(b, v, pressionado):
    """Devolve (S, pixels[y][x]) com cor '#rrggbb' ou None (transparente). S = 2*b + 2."""
    S = 2 * b + 2
    r = TAMANHOS[b]
    p = paleta(v, pressionado)
    dentro = [[not (x + y < r or (S - 1 - x) + y < r or x + (S - 1 - y) < r or (S - 1 - x) + (S - 1 - y) < r) for x in range(S)] for y in range(S)]

    def prof(x, y):
        # profundidade = passos (4 vizinhos) ate sair da forma
        if not dentro[y][x]:
            return 0
        d = 1
        fila = [(x, y)]
        visto = {(x, y)}
        while d < 8:
            prox = []
            for (cx, cy) in fila:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = cx + dx, cy + dy
                    if not (0 <= nx < S and 0 <= ny < S) or not dentro[ny][nx]:
                        return d
                    if (nx, ny) not in visto:
                        visto.add((nx, ny))
                        prox.append((nx, ny))
            fila = prox
            d += 1
        return d

    out = [[None] * S for _ in range(S)]
    for y in range(S):
        for x in range(S):
            if not dentro[y][x]:
                continue
            d = prof(x, y)
            dt, dl, db, dr = y, x, S - 1 - y, S - 1 - x
            m = min(dt, dl, db, dr)
            claro = (m == dt or m == dl) and not (m == db or m == dr)
            escuro = (m == db or m == dr) and not (m == dt or m == dl)
            if d == 1:
                cor = INK
            elif d == 2:
                cor = p['hi'] if claro else p['lo'] if escuro else mistura(p['hi'], p['lo'])
            elif d <= b and not (b == 4 and d == 4):
                cor = p['band']
            elif b == 4 and d == 4:
                # sombra interna (inverso do bisel) em volta do miolo: da profundidade a moldura larga
                cor = p['lo'] if claro else p['hi'] if escuro else mistura(p['hi'], p['lo'])
                cor = mistura(cor, p['band'])
            else:
                cor = p['well']
            out[y][x] = cor
    if b >= 3:
        # rebites: um pixel claro em cada canto da faixa
        o = 2 if b == 3 else 2
        for (x, y) in ((o, o), (S - 1 - o, o), (o, S - 1 - o), (S - 1 - o, S - 1 - o)):
            if out[y][x] == p['band']:
                out[y][x] = p['hi'] if not pressionado else mistura(p['hi'], p['band'])
    return S, out


def png(w, h, px):
    """PNG RGBA minimo (so biblioteca padrao)."""
    raw = b''
    for y in range(h):
        raw += b'\x00'
        for x in range(w):
            c = px[y][x]
            raw += bytes(hex_rgb(c) + (255,)) if c else b'\x00\x00\x00\x00'

    def chunk(t, d):
        c = struct.pack('>I', len(d)) + t + d
        return c + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)

    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')


def uri(w, h, px):
    return 'url("data:image/png;base64,' + base64.b64encode(png(w, h, px)).decode('ascii') + '")'


def ponta():
    """Ponta (triangulo para baixo) do rotulo da arma: aponta para o botao de trocar arma. 7x4."""
    I, F = INK, VARIANTES['wood']['well']
    g = ['IIIIIII', '.IFFFI.', '..IFI..', '...I...']
    cor = {'I': I, 'F': F, '.': None}
    return 7, 4, [[cor[c] for c in r] for r in g]


def main():
    linhas = ['/* GERADO por tools/gerar-sprites-hud.py: nao editar a mao. Molduras 9-slice pixel art da HUD (ver o gerador para a linguagem visual). */', ':root{']
    total = 0
    for v in VARIANTES:
        for b in TAMANHOS:
            for est, suf in ((False, 'u'), (True, 'd')):
                S, px = moldura(b, v, est)
                linhas.append('--hs-%s-%d%s:%s;' % (v, b, suf, uri(S, S, px)))
                total += 1
    w, h, px = ponta()
    linhas.append('--hs-ponta:%s;' % uri(w, h, px))
    linhas.append('}')
    aqui = os.path.dirname(os.path.abspath(__file__))
    destino = os.path.join(aqui, '..', 'css', 'sprites-hud.css')
    with open(destino, 'w', encoding='utf-8') as f:
        f.write('\n'.join(linhas) + '\n')
    print('%d molduras + ponta em %s (%d bytes)' % (total, os.path.normpath(destino), os.path.getsize(destino)))


if __name__ == '__main__':
    main()
