import { VueDialog } from "@/module/applications/vue-dialog";
import ImportJsonActorsDialog from "@/module/actor/shared/ImportJsonActorsDialog.vue";

/**
 * JSON Actor Import Settings Menu Class
 */
export class JsonActorImportMenu extends VueDialog {
  constructor(options = {}) {
    super(
      ImportJsonActorsDialog,
      {},
      {
        ...options,
        window: {
          title: "Import JSON NPCs / Monsters",
          icon: "fas fa-file-import",
          minimizable: false,
          resizable: false
        },
        position: {
          width: 760
        }
      }
    );
  }
}

/**
 * Open the JSON Actor Import Dialog
 */
export function openJsonActorImportDialog(): void {
  VueDialog.show(
    ImportJsonActorsDialog,
    {},
    {
      window: {
        title: "Import JSON NPCs / Monsters",
        icon: "fas fa-file-import",
        minimizable: false,
        resizable: false
      },
      position: {
        width: 760
      }
    }
  );
}
