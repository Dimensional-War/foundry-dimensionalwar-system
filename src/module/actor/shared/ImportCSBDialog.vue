<template>
  <div class="dw-csb-import-dialog">
    <h2>Import CSB Actors</h2>

    <div class="dw-import-section">
      <h3><i class="fas fa-file-import"></i> Import Individual Actor</h3>
      <p>Select a single Custom System Builder actor JSON file to import.</p>
      <div class="flex gap-2">
        <div class="basis-1/2">
          <input
            ref="singleFileInput"
            type="file"
            accept=".json"
            class="dw-file-input"
            @change="handleSingleFileSelected"
          />
        </div>
        <div class="basis-auto">
          <button
            class="dw-btn dw-btn-primary"
            :disabled="!singleFile || importing"
            @click="importSingle"
          >
            <i class="fas fa-upload"></i>
            Import
          </button>
        </div>
      </div>
    </div>

    <div class="dw-divider"></div>

    <div class="dw-import-section">
      <h3><i class="fas fa-file-archive"></i> Bulk Import from ZIP</h3>
      <p>
        Select a ZIP file containing multiple CSB actor JSON files. All valid
        actors will be imported.
      </p>
      <div class="flex gap-2">
        <input
          ref="zipFileInput"
          type="file"
          accept=".zip"
          class="dw-file-input flex-1"
          @change="handleZipFileSelected"
        />
        <button
          class="dw-btn dw-btn-primary"
          :disabled="!zipFile || importing"
          @click="importBulk"
        >
          <i class="fas fa-cloud-upload-alt"></i>
          Import ZIP
        </button>
      </div>
    </div>

    <!-- Progress/Results Display -->
    <div v-if="importing" class="dw-import-progress">
      <div class="flex items-center gap-2">
        <i class="fas fa-spinner fa-spin"></i>
        <span>Importing actors...</span>
      </div>
    </div>

    <div v-if="results.length > 0" class="dw-import-results">
      <h3><i class="fas fa-list-check"></i> Import Results</h3>
      <div class="dw-results-list">
        <div
          v-for="(result, index) in results"
          :key="index"
          class="dw-result-item"
          :class="{
            'dw-result-success': result.success,
            'dw-result-error': !result.success
          }"
        >
          <i
            class="fas"
            :class="result.success ? 'fa-check-circle' : 'fa-times-circle'"
            :style="{
              color: result.success ? '#2ecc71' : '#e74c3c'
            }"
          ></i>
          <span class="flex-1">{{ result.name }}</span>
          <span v-if="result.error" class="dw-error-text">
            {{ result.error }}
          </span>
        </div>
      </div>
      <div class="dw-results-summary">
        <strong>Summary:</strong>
        {{ successCount }} successful, {{ failureCount }} failed
      </div>
    </div>

    <!-- Close Button -->
    <div class="dw-dialog-footer">
      <button
        class="dw-btn dw-btn-secondary"
        :disabled="importing"
        @click="closeDialog"
      >
        <i class="fas fa-times"></i> Close
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { VueDialog } from "@/module/applications/vue-dialog";
import {
  importCSBActorFromFile,
  importCSBActorsFromZip
} from "@/module/utils/csb-importer";

interface ImportResult {
  success: boolean;
  actor?: Actor;
  error?: string;
  name?: string;
}

interface Props {
  dialog: VueDialog;
}

// Receive dialog instance as prop
const props = defineProps<Props>();

const singleFileInput = ref<HTMLInputElement | null>(null);
const zipFileInput = ref<HTMLInputElement | null>(null);
const singleFile = ref<File | null>(null);
const zipFile = ref<File | null>(null);
const importing = ref(false);
const results = ref<ImportResult[]>([]);

const successCount = computed(
  () => results.value.filter(r => r.success).length
);
const failureCount = computed(
  () => results.value.filter(r => !r.success).length
);

function handleSingleFileSelected(event: Event) {
  const target = event.target as HTMLInputElement;
  singleFile.value = target.files?.[0] || null;
  results.value = [];
}

function handleZipFileSelected(event: Event) {
  const target = event.target as HTMLInputElement;
  zipFile.value = target.files?.[0] || null;
  results.value = [];
}

async function importSingle() {
  if (!singleFile.value) return;

  importing.value = true;
  results.value = [];

  try {
    const result = await importCSBActorFromFile(singleFile.value);
    results.value = [result];

    if (result.success) {
      ui.notifications?.info(`Successfully imported actor: ${result.name}`);
    } else {
      ui.notifications?.error(`Failed to import actor: ${result.error}`);
    }
  } catch (error) {
    ui.notifications?.error(`Import error: ${error}`);
  } finally {
    importing.value = false;
    // Reset file input
    if (singleFileInput.value) {
      singleFileInput.value.value = "";
    }
    singleFile.value = null;
  }
}

async function importBulk() {
  if (!zipFile.value) return;

  importing.value = true;
  results.value = [];

  try {
    const importResults = await importCSBActorsFromZip(zipFile.value);
    results.value = importResults;

    const successCount = importResults.filter(r => r.success).length;
    const totalCount = importResults.length;

    if (successCount === totalCount) {
      ui.notifications?.info(
        `Successfully imported all ${successCount} actors!`
      );
    } else if (successCount > 0) {
      ui.notifications?.warn(
        `Imported ${successCount} of ${totalCount} actors. Check results for details.`
      );
    } else {
      ui.notifications?.error(`Failed to import any actors.`);
    }
  } catch (error) {
    ui.notifications?.error(`Bulk import error: ${error}`);
  } finally {
    importing.value = false;
    // Reset file input
    if (zipFileInput.value) {
      zipFileInput.value.value = "";
    }
    zipFile.value = null;
  }
}

function closeDialog() {
  // Close the dialog using the prop
  if (props.dialog) {
    props.dialog.close();
  }
}
</script>

<style scoped>
.dw-csb-import-dialog {
  padding: 1.5rem;
  min-width: 500px;
  font-family: var(--font-primary, "Signika", serif);
  font-size: 13px;
  color: #444;
  background: #f8f7f4;
}

.dw-csb-import-dialog h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-weight: 600;
  border-bottom: 2px solid #9e9a8e;
  padding-bottom: 0.5rem;
}

.dw-csb-import-dialog h3 {
  color: #34495e;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.dw-csb-import-dialog h3 i {
  margin-right: 0.5rem;
  color: #4a90e2;
}

.dw-import-section {
  padding: 1rem;
  border: 1px solid #9e9a8e;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.6);
  margin-bottom: 1rem;
}

.dw-import-section p {
  color: #666;
  font-size: 12px;
}

.dw-file-input {
  padding: 0.5rem;
  border: 1px solid #9e9a8e;
  border-radius: 2px;
  background: white;
  font-family: inherit;
  font-size: 13px;
}

.dw-btn {
  padding: 0.5rem 1rem;
  border: 1px outset #aaa;
  border-radius: 2px;
  background: #f0ece4;
  cursor: pointer;
  font-weight: 500;
  font-family: inherit;
  font-size: 13px;
  transition: background 0.15s;
  white-space: nowrap;
}

.dw-btn i {
  margin-right: 0.35rem;
}

.dw-btn:hover:not(:disabled) {
  background: #e0dcd4;
}

.dw-btn:active:not(:disabled) {
  border-style: inset;
  background: #d0ccc4;
}

.dw-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dw-btn-primary {
  background: #4a90e2;
  color: white;
  border-color: #357abd;
}

.dw-btn-primary:hover:not(:disabled) {
  background: #357abd;
}

.dw-btn-primary:active:not(:disabled) {
  background: #2d6ba5;
}

.dw-btn-secondary {
  background: #6c757d;
  color: white;
  border-color: #5a6268;
}

.dw-btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.dw-btn-secondary:active:not(:disabled) {
  background: #4e555b;
}

.dw-divider {
  height: 1px;
  background: #9e9a8e;
  margin: 1rem 0;
}

.dw-import-progress {
  padding: 1rem;
  background: rgba(74, 144, 226, 0.1);
  border: 1px solid #4a90e2;
  border-radius: 3px;
  margin-bottom: 1rem;
}

.dw-import-progress i {
  color: #4a90e2;
}

.dw-import-results {
  padding: 1rem;
  border: 1px solid #9e9a8e;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.6);
}

.dw-results-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 0.75rem;
}

.dw-result-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 2px;
  background: white;
  border: 1px solid #ddd;
}

.dw-result-item i {
  flex-shrink: 0;
}

.dw-error-text {
  font-size: 11px;
  color: #e74c3c;
  font-style: italic;
}

.dw-result-success {
  border-left: 3px solid #2ecc71;
}

.dw-result-error {
  border-left: 3px solid #e74c3c;
}

.dw-results-summary {
  font-size: 12px;
  background: rgba(0, 0, 0, 0.05);
  padding: 0.75rem;
  border-radius: 2px;
  border: 1px solid #9e9a8e;
}

.dw-dialog-footer {
  border-top: 1px solid #9e9a8e;
  padding-top: 1rem;
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
}
</style>
