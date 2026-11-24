#!/usr/bin/env python3
"""Gera os sprites 9-slice (molduras pixel art) da HUD do Bit Survival.

Saida: css/sprites-hud.css, com variaveis CSS do tipo --hs-<variante>-<borda><u|d> contendo um PNG embutido (data URI).
Nada para baixar e nada para desenhar em JavaScript: a HUD continua funcionando offline (APK, navegador sem internet).

Uso: python3 tools/gerar-sprites-hud.py   (so biblioteca padrao do Python)

Linguagem visual (a MESMA do menu, das configuracoes, do crafting, do inventario e do arsenal: .islot e .screen em css/estilo.css):
- moldura plana e quadrada: borda de 2 pixels da arte numa cor so (sem bisel, sem contorno marrom), miolo liso; a sombra dura embaixo vem do CSS (hud-pixel.css);
- paleta das telas: painel #1f242c, borda #3f4652, musgo #8DA568, ambar #C79A54, vermelho #C0634A, sombra #0c0e12;
- variantes por funcao: wood (neutro, o .islot), moss (interagir), blood (atacar, com um filete interno mais escuro para dar peso), gold (item na mao ou ativo, o .islot.held), grey (indisponivel, o .islot.lock), night (placa de aviso de estado);
- molduras de 3 e 4 pixels so aumentam o recuo do miolo (mesma borda de 2 pixels), para o tamanho dos botoes nao mudar;
- 'u' = em repouso, 'd' = pressionado (miolo mais escuro; o conteudo desce 1 pixel pelo CSS).
O tamanho da moldura em tela e sempre (borda x --hu), onde --hu e o pixel da HUD ajustado ao pixel fisico da tela (ver applyUiScale em js/01-base.js).
"""
import base64
import os
import struct
import zlib

EDGE = '#3f4652'
VARIANTES = {
    #            borda       miolo       filete interno (so atacar)
    'wood':  dict(edge=EDGE,      well='#1f242c'),
    'moss':  dict(edge='#8DA568', well='#232b22'),
    'blood': dict(edge='#C0634A', well='#3a211d', rim='#7a3b2e'),
    'gold':  dict(edge='#C79A54', well='#2b2820'),
    'grey':  dict(edge='#2e343e', well='#14171c'),
    'night': dict(edge=EDGE,      well='#171A20'),   # placas de aviso de estado (miolo escuro para o texto colorido)
}
# (largura da borda em pixels da arte, recorte do canto em pixels)
TAMANHOS = {2: 1, 3: 2, 4: 3}


def hex_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def escurece(h, f):
    r, g, b = hex_rgb(h)
    return '#%02x%02x%02x' % (int(r * f), int(g * f), int(b * f))


def paleta(v, pressionado):
    p = dict(VARIANTES[v])
    if pressionado:
        p['well'] = escurece(p['well'], .72)
        if 'rim' in p:
            p['rim'] = escurece(p['rim'], .8)
    return p


def moldura(b, v, pressionado):
    """Devolve (S, pixels[y][x]) com cor '#rrggbb'. S = 2*b + 2. Quadrada, borda de 2 pixels, miolo liso."""
    S = 2 * b + 2
    p = paleta(v, pressionado)
    out = [[None] * S for _ in range(S)]
    for y in range(S):
        for x in range(S):
            m = min(x, y, S - 1 - x, S - 1 - y)
            if m < 2:
                cor = p['edge']
            elif m == 2 and b >= 3 and 'rim' in p:
                cor = p['rim']
            else:
                cor = p['well']
            out[y][x] = cor
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
    I, F = EDGE, VARIANTES['wood']['well']
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
