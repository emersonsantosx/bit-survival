#!/usr/bin/env python3
"""Gera a fonte pixel BitHUD (5x7, so maiusculas) usada pela HUD do Bit Survival.

Por que existe: a HUD precisa de uma tipografia pixel que funcione OFFLINE (APK, navegador sem internet).
A fonte e desenhada aqui, pixel por pixel, e embutida em css/fonte-hud.css como data URI (nada para baixar).

Uso: python3 tools/gerar-fonte-hud.py   (precisa de fontTools: pip install fonttools)
Saida: css/fonte-hud.css

Regras da fonte:
- cada pixel do desenho vira um quadrado de 100 unidades (em 1000 por em): font-size 10px = 1px por pixel;
- letras minusculas usam o MESMO desenho das maiusculas (a HUD fala em caixa alta);
- acentos do portugues (ACENTOS) sao desenhados acima da letra, com uma linha de folga; o cedilha fica abaixo da linha de base;
- caracteres que nao existem aqui caem na fonte seguinte da lista (Courier New).
"""
import base64
import io
import os
import unicodedata

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

PX = 100  # unidades por pixel do desenho

# ---------------------------------------------------------------- letras e numeros (5 colunas x 7 linhas, de cima para baixo)
BASE = {
    'A': ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    'B': ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
    'C': ['.####', '#....', '#....', '#....', '#....', '#....', '.####'],
    'D': ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
    'E': ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
    'F': ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
    'G': ['.####', '#....', '#....', '#..##', '#...#', '#...#', '.###.'],
    'H': ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    'I': ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
    'J': ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
    'K': ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
    'L': ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
    'M': ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
    'N': ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
    'O': ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    'P': ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
    'Q': ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
    'R': ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
    'S': ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
    'T': ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
    'U': ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    'V': ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
    'W': ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
    'X': ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
    'Y': ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
    'Z': ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
    '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
    '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
    '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
    '3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
    '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
    '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
    '6': ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
    '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
    '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
    '9': ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
}

# ---------------------------------------------------------------- pontuacao (largura propria)
PONT = {
    '.': ['', '', '', '', '', '', '#'],
    ',': ['', '', '', '', '', '.#', '#.'],
    ':': ['', '', '#', '', '', '#', ''],
    ';': ['', '', '.#', '', '', '.#', '#.'],
    '!': ['#', '#', '#', '#', '#', '', '#'],
    '?': ['.###.', '#...#', '....#', '...#.', '..#..', '', '..#..'],
    "'": ['#', '#', '', '', '', '', ''],
    '"': ['#.#', '#.#', '', '', '', '', ''],
    '-': ['', '', '', '###', '', '', ''],
    '+': ['', '..#..', '..#..', '#####', '..#..', '..#..', ''],
    '/': ['....#', '....#', '...#.', '..#..', '.#...', '#....', '#....'],
    '%': ['##..#', '##.#.', '...#.', '..#..', '.#...', '.#.##', '#..##'],
    '(': ['..#', '.#.', '#..', '#..', '#..', '.#.', '..#'],
    ')': ['#..', '.#.', '..#', '..#', '..#', '.#.', '#..'],
    '[': ['###', '#..', '#..', '#..', '#..', '#..', '###'],
    ']': ['###', '..#', '..#', '..#', '..#', '..#', '###'],
    '=': ['', '', '#####', '', '#####', '', ''],
    '_': ['', '', '', '', '', '', '#####'],
    '*': ['', '#.#.#', '.###.', '#####', '.###.', '#.#.#', ''],
    '>': ['#..', '.#.', '..#', '.#.', '#..', '', ''],
    '<': ['..#', '.#.', '#..', '.#.', '..#', '', ''],
    '·': ['', '', '', '#', '', '', ''],      # ponto do meio
    '°': ['.##', '#.#', '.##', '', '', '', ''],  # grau
    '×': ['', '', '#.#', '.#.', '#.#', '', ''],   # vezes
}
ALIAS = {'’': "'", '‘': "'", '“': '"', '”': '"', 'x': '×'}  # x minusculo e o X maiusculo, ver abaixo

# ---------------------------------------------------------------- acentos (duas linhas acima da letra)
ACENTOS = {
    'agudo': ['...#.', '..#..'],
    'grave': ['.#...', '..#..'],
    'circ': ['..#..', '.#.#.'],
    'til': ['.##.#', '#.##.'],
    'trema': ['.#.#.', '.....'],
}
# letra acentuada -> (letra base, acento)
COMPOSTAS = {
    'Á': ('A', 'agudo'), 'À': ('A', 'grave'), 'Â': ('A', 'circ'), 'Ã': ('A', 'til'),
    'É': ('E', 'agudo'), 'Ê': ('E', 'circ'), 'È': ('E', 'grave'),
    'Í': ('I', 'agudo'), 'Î': ('I', 'circ'),
    'Ó': ('O', 'agudo'), 'Ô': ('O', 'circ'), 'Õ': ('O', 'til'),
    'Ú': ('U', 'agudo'), 'Ü': ('U', 'trema'),
}
CEDILHA = 'Ç'  # C com cauda embaixo

ROWS_ACIMA = 3   # duas de acento e uma de folga
ROWS_ABAIXO = 2  # cedilha


def trim(rows):
    """Remove colunas vazias a esquerda/direita (fonte proporcional), devolve (linhas, largura)."""
    cols = [i for r in rows for i, c in enumerate(r) if c == '#']
    if not cols:
        return rows, 0
    a, b = min(cols), max(cols)
    return [r[a:b + 1].ljust(b - a + 1, '.') for r in rows], b - a + 1


def montar():
    """Devolve {caractere: (matriz de linhas, avanco em pixels)}. A matriz tem ROWS_ACIMA+7+ROWS_ABAIXO linhas."""
    out = {}

    def poe(ch, rows7, adv, topo=None, baixo=None):
        topo = topo or ['.' * 5] * ROWS_ACIMA
        baixo = baixo or ['.' * 5] * ROWS_ABAIXO
        w = max(len(r) for r in topo + rows7 + baixo)
        pad = lambda r: r.ljust(w, '.')
        out[ch] = ([pad(r) for r in topo] + [pad(r) for r in rows7] + [pad(r) for r in baixo], adv)

    for ch, rows in BASE.items():
        if ch.isdigit():
            poe(ch, rows, 6)          # numeros com largura fixa (tabela alinhada)
        else:
            t, w = trim(rows)
            poe(ch, t, w + 1)
    for ch, rows in PONT.items():
        rows = [r.ljust(max(len(x) for x in rows), '.') for r in rows]
        t, w = trim(rows)
        poe(ch, t, w + 1)
    for ch, (b, ac) in COMPOSTAS.items():
        t, w = trim(BASE[b])
        a = ACENTOS[ac]
        # acento centralizado na letra: usa a largura da letra base (5 colunas) alinhada ao centro
        full = [r.ljust(5, '.') for r in BASE[b]]
        mat = [a[0], a[1], '.....'] + full
        if w < 5:   # letra estreita (I): o acento tambem e cortado
            mat = [r[1:4] for r in mat]
            adv = 4
        else:
            adv = 6
        poe(ch, mat[ROWS_ACIMA:], adv, topo=mat[:ROWS_ACIMA])
    # cedilha
    c = [r for r in BASE['C']]
    poe(CEDILHA, c, 6, baixo=['..#..', '.##..'])
    # espaco
    out[' '] = (['.....'] * (ROWS_ACIMA + 7 + ROWS_ABAIXO), 4)
    return out


def retangulos(mat):
    """Junta pixels vizinhos de cada linha em retangulos. Devolve [(x0,y0,x1,y1)] em unidades de fonte."""
    rects = []
    n = len(mat)
    for ri, row in enumerate(mat):
        y_base = (ROWS_ABAIXO + 7 + ROWS_ACIMA - 1 - ri - ROWS_ABAIXO) * PX  # topo da linha em relacao a linha de base
        x = 0
        while x < len(row):
            if row[x] == '#':
                s = x
                while x < len(row) and row[x] == '#':
                    x += 1
                # +2 unidades de sobreposicao para cima: sem fresta entre linhas ao rasterizar
                rects.append((s * PX, y_base, x * PX, y_base + PX + 2))
            else:
                x += 1
    return rects


def main():
    glifos = montar()
    ordem = ['.notdef'] + ['uni%04X' % ord(c) for c in glifos]
    cmap = {}
    for ch in glifos:
        cmap[ord(ch)] = 'uni%04X' % ord(ch)
        low = ch.lower()
        if low != ch and ord(low) not in cmap:
            cmap[ord(low)] = 'uni%04X' % ord(ch)   # minuscula usa o desenho da maiuscula
    # aliases tipograficos
    for src, dst in ALIAS.items():
        if src == 'x':
            continue
        if dst in glifos:
            cmap[ord(src)] = 'uni%04X' % ord(dst)
    cmap[ord('×')] = 'uni%04X' % ord('×')
    cmap[0xA0] = 'uni0020'   # espaco sem quebra

    fb = FontBuilder(1000, isTTF=True)
    fb.setupGlyphOrder(ordem)
    fb.setupCharacterMap(cmap)
    glyphs, metrics = {}, {}
    pen = TTGlyphPen(None)
    glyphs['.notdef'] = pen.glyph()
    metrics['.notdef'] = (500, 0)
    for ch, (mat, adv) in glifos.items():
        name = 'uni%04X' % ord(ch)
        pen = TTGlyphPen(None)
        for (x0, y0, x1, y1) in retangulos(mat):
            pen.moveTo((x0, y0))
            pen.lineTo((x0, y1))
            pen.lineTo((x1, y1))
            pen.lineTo((x1, y0))
            pen.closePath()
        glyphs[name] = pen.glyph()
        metrics[name] = (adv * PX, 0)
    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=(ROWS_ACIMA + 7) * PX, descent=-ROWS_ABAIXO * PX)
    fb.setupNameTable({'familyName': 'BitHUD', 'styleName': 'Regular',
                       'uniqueFontIdentifier': 'BitHUD-Regular', 'fullName': 'BitHUD Regular', 'psName': 'BitHUD-Regular'})
    fb.setupOS2(sTypoAscender=(ROWS_ACIMA + 7) * PX, sTypoDescender=-ROWS_ABAIXO * PX, sTypoLineGap=0,
                usWinAscent=(ROWS_ACIMA + 7) * PX, usWinDescent=ROWS_ABAIXO * PX, sxHeight=7 * PX, sCapHeight=7 * PX)
    fb.setupPost()
    fb.font.flavor = 'woff'
    buf = io.BytesIO()
    fb.save(buf)
    dados = buf.getvalue()
    b64 = base64.b64encode(dados).decode('ascii')
    aqui = os.path.dirname(os.path.abspath(__file__))
    destino = os.path.join(aqui, '..', 'css', 'fonte-hud.css')
    with open(destino, 'w', encoding='utf-8') as f:
        f.write('/* GERADO por tools/gerar-fonte-hud.py: nao editar a mao. Fonte pixel 5x7 da HUD (so maiusculas, 1 pixel = font-size/10). */\n')
        f.write('@font-face{font-family:"BitHUD";font-style:normal;font-weight:400;font-display:block;src:url(data:font/woff;base64,' + b64 + ') format("woff")}\n')
    print('fonte gerada: %d glifos, %d bytes (woff), css em %s' % (len(glifos), len(dados), os.path.normpath(destino)))


if __name__ == '__main__':
    main()
