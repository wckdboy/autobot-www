"""Contracts for the shared lowercase pixel alphabet and generated web tokens."""
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class BrandTests(unittest.TestCase):
    def test_every_product_has_a_distinct_signal(self):
        brands = json.loads((ROOT / 'brand/kit.json').read_text())['brands']
        for mode in ('onPaper', 'onInk'):
            colors = [brand[mode].upper() for brand in brands.values()]
            self.assertEqual(len(set(colors)), len(colors), f'duplicate {mode} product signals')

    def test_marks_use_one_six_row_lowercase_alphabet(self):
        brands = json.loads((ROOT / 'brand/kit.json').read_text())['brands']
        for key, brand in brands.items():
            glyph = brand['glyph']
            self.assertEqual(len(glyph), 6, key)
            self.assertTrue(all(len(row) == len(glyph[0]) and set(row) <= {'.', '#'} for row in glyph), key)
            self.assertLessEqual(len(glyph[0]), 8, key)
        self.assertEqual(brands['polycore']['glyph'], brands['polykrom']['glyph'])
        self.assertEqual(brands['world']['glyph'], brands['wckd']['glyph'])
        self.assertEqual(brands['axit']['glyph'], brands['autobot']['glyph'])

    def test_generated_files_are_bound_to_the_kit(self):
        kit = json.loads((ROOT / 'brand/kit.json').read_text())
        web = (ROOT / 'brand/web.css').read_text()
        for key, value in kit['web'].items():
            web = web.replace('{{' + key + '}}', value)
        self.assertEqual(web, (ROOT / 'public/brand/web.css').read_text())
        self.assertNotIn('{{', web)
        for key, brand in kit['brands'].items():
            self.assertEqual(json.loads((ROOT / 'public/brand' / key / 'source.json').read_text()), brand)

    def test_axit_terminal_mask_is_the_same_lowercase_a(self):
        kit = json.loads((ROOT / 'brand/kit.json').read_text())
        source = ROOT.parent / 'axit/assets/mark.txt'
        if not source.exists():
            self.skipTest('Axit sibling checkout is unavailable; cross-repo logo sync is unverified')
        mask = source.read_text().splitlines()
        expected = ['........', *['.' + row.replace('#', 'A') + '.' for row in kit['brands']['axit']['glyph']], '........']
        self.assertEqual(mask, expected)


if __name__ == '__main__':
    unittest.main()
