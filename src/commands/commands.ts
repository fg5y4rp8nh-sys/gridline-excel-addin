// Ribbon commands. They run in the shared runtime, so they can talk to the task pane directly.
import { readUsed, replaceUsed } from '../lib/excel';
import { fix, IssueKind } from '../lib/clean';

type Tab = 'import' | 'clean' | 'formulas' | 'export' | 'sync';

/** Show the task pane on a given tab. App.tsx listens for `gridline:open`. */
async function open(tab: Tab, event: Office.AddinCommands.Event) {
  try {
    (window as unknown as { __GRIDLINE_TAB?: Tab }).__GRIDLINE_TAB = tab;
    window.dispatchEvent(new CustomEvent('gridline:open', { detail: tab }));
    await Office.addin.showAsTaskpane();
  } finally { event.completed(); }
}

/** "Quick clean": fixes the whole sheet without opening the pane. */
async function cleanSheet(event: Office.AddinCommands.Event) {
  try {
    const b = await readUsed();
    if (b) {
      const all = new Set<IssueKind>(['duplicates', 'spaces', 'names', 'phones', 'emails']);
      await replaceUsed(b, fix(b.values, all).values);
    }
  } finally { event.completed(); }
}

Office.onReady(() => {
  if (!Office.actions) return; // opened outside Excel
  Office.actions.associate('openImport', (e: Office.AddinCommands.Event) => open('import', e));
  Office.actions.associate('openClean', (e: Office.AddinCommands.Event) => open('clean', e));
  Office.actions.associate('openFormulas', (e: Office.AddinCommands.Event) => open('formulas', e));
  Office.actions.associate('openInvoice', (e: Office.AddinCommands.Event) => open('export', e));
  Office.actions.associate('openSync', (e: Office.AddinCommands.Event) => open('sync', e));
  Office.actions.associate('cleanSheet', cleanSheet);
});
