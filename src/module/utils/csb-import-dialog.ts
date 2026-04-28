/**
 * CSB Import Dialog - Shows a dialog for importing Custom System Builder actors
 */

import { VueDialog } from "@/module/applications/vue-dialog";
import ImportCSBDialog from "@/module/actor/shared/ImportCSBDialog.vue";

/**
 * CSB Import Settings Menu Class
 * Used for registering the menu in Foundry's settings system
 */
export class CSBImportMenu extends VueDialog {
  constructor(options = {}) {
    super(
      ImportCSBDialog,
      {},
      {
        ...options,
        window: {
          title: "Import CSB Actors",
          icon: "fas fa-file-import",
          minimizable: false,
          resizable: false
        },
        position: {
          width: 600
        }
      }
    );
  }
}

/**
 * Open the CSB Import Dialog
 */
export function openCSBImportDialog(): void {
  VueDialog.show(
    ImportCSBDialog,
    {},
    {
      window: {
        title: "Import CSB Actors",
        icon: "fas fa-file-import",
        minimizable: false,
        resizable: false
      },
      position: {
        width: 600
      }
    }
  );
}
