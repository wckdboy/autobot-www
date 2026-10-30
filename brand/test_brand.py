"""Contracts for the shared lowercase pixel alphabet and generated web tokens."""
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
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

    def test_guide_documents_both_signal_surfaces(self):
        guide = (ROOT / 'src/views/BrandKit.astro').read_text()
        self.assertIn('<code>{own.onInk}</code>', guide)
        self.assertIn('<code>{b.onInk}</code>', guide)
        self.assertNotIn('on white and on ink', guide)
        policy = (ROOT / 'BRAND.md').read_text()
        self.assertIn('`onPaper`', policy)
        self.assertIn('`onInk`', policy)
        self.assertNotIn('used the same on white and on', policy)

    def test_nightfall_summary_matches_archived_studies(self):
        page = (ROOT / 'src/views/NightfallLab.astro').read_text()
        self.assertNotIn('studies are a plan', page)
        self.assertIn('study runner', page)
        self.assertIn('studies were in review', page)


class SyncTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.workspace = Path(self.tmp.name)
        self.web = self.workspace / 'web'
        (self.web / 'scripts').mkdir(parents=True)
        (self.web / 'public/brand').mkdir(parents=True)
        shutil.copy2(ROOT / 'scripts/sync-brand.py', self.web / 'scripts/sync-brand.py')
        (self.web / 'public/brand/web.css').write_text('/* canonical */\n')

    def sync(self, *args):
        return subprocess.run(['python3', str(self.web / 'scripts/sync-brand.py'), *args],
                              capture_output=True, text=True, timeout=10)

    def init(self, project):
        target = self.workspace / project
        target.mkdir()
        subprocess.run(['git', 'init', '-q', str(target)], check=True)
        return target

    def test_stylesheet_sync_rejects_missing_checkout_without_creating_it(self):
        result = self.sync('axit', '--write')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Missing project repository', result.stderr)
        self.assertFalse((self.workspace / 'axit').exists())

    def test_existing_directory_is_not_a_checkout(self):
        (self.workspace / 'axit').mkdir()
        result = self.sync('axit', '--write')
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse((self.workspace / 'axit/site').exists())

    def test_preflight_rejects_all_targets_before_writing(self):
        axit = self.init('axit')
        result = self.sync('axit', 'niobium', '--write')
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse((axit / 'site').exists())
        self.assertFalse((self.workspace / 'niobium').exists())

    def test_write_and_drift_check_for_existing_checkout(self):
        axit = self.init('axit')
        self.assertNotEqual(self.sync('axit').returncode, 0)
        for _ in range(2):
            result = self.sync('axit', '--write')
            self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual((axit / 'site/public/wckd-web.css').read_bytes(),
                         (self.web / 'public/brand/web.css').read_bytes())
        self.assertEqual(self.sync('axit').returncode, 0)

    def test_logo_sync_rejects_missing_checkout(self):
        result = self.sync('tinyrex', '--logos', '--write')
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse((self.workspace / 'tinyrex').exists())


if __name__ == '__main__':
    unittest.main()
