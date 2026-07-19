<template>
  <div class="dw-json-import-dialog">
    <h2>Import JSON NPCs / Monsters</h2>

    <div class="dw-import-section">
      <h3><i class="fas fa-folder-open"></i> Destination Folder</h3>
      <p>
        Optional default path. Use / for nested folders. Each JSON entry can
        override this with folderPath (or folder/path/destinationFolder).
      </p>
      <input
        v-model="folderPath"
        type="text"
        class="dw-text-input"
        placeholder="Enemies/Bosses"
      />
    </div>

    <div class="dw-import-section">
      <h3><i class="fas fa-file-import"></i> Import JSON File</h3>
      <div class="flex gap-2">
        <input
          ref="fileInput"
          type="file"
          accept=".json,application/json"
          class="dw-file-input basis-8/12"
          @change="handleFileSelected"
        />
        <button
          class="dw-btn dw-btn-primary basis-4/12"
          :disabled="importing || !selectedFile"
          @click="importFromFile"
        >
          <i class="fas fa-upload"></i>
          Import File
        </button>
      </div>
    </div>

    <div class="dw-import-section">
      <h3><i class="fas fa-paste"></i> Paste JSON</h3>
      <p>Supports single object, array, or top-level actors list.</p>
      <textarea
        v-model="jsonText"
        rows="12"
        class="dw-textarea"
        placeholder='{"name":"Goblin","type":"monster","hp":{"max":120}}'
      ></textarea>
      <div class="mt-2">
        <button
          class="dw-btn dw-btn-primary"
          :disabled="importing || !jsonText.trim()"
          @click="importFromText"
        >
          <i class="fas fa-file-import"></i>
          Import Pasted JSON
        </button>
      </div>
    </div>

    <div v-if="importing" class="dw-import-progress">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Importing actors...</span>
    </div>

    <div v-if="results.length" class="dw-import-results">
      <h3><i class="fas fa-list-check"></i> Results</h3>
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
          ></i>
          <span class="flex-1">{{ result.name || 'Unknown' }}</span>
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

    <div class="dw-dialog-footer">
      <button
        class="dw-btn dw-btn-secondary"
        :disabled="importing"
        @click="closeDialog"
      >
        <i class="fas fa-times"></i>
        Close
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { VueDialog } from "@/module/applications/vue-dialog";
import {
  importJsonActors,
  type JsonImportResult
} from "@/module/utils/json-actor-importer";

interface Props {
  dialog: VueDialog;
}

const props = defineProps<Props>();

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const jsonText = ref("");
const folderPath = ref("");
const importing = ref(false);
const results = ref<JsonImportResult[]>([]);

const successCount = computed(() => results.value.filter(r => r.success).length);
const failureCount = computed(() => results.value.filter(r => !r.success).length);

function handleFileSelected(event: Event) {
  const target = event.target as HTMLInputElement;
  selectedFile.value = target.files?.[0] || null;
}

async function parseJsonText(rawText: string): Promise<any> {
  try {
    return JSON.parse(rawText);
  } catch (error) {
    throw new Error(
      `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function runImport(payload: any) {
  importing.value = true;
  results.value = [];

  try {
    const importResults = await importJsonActors(payload, folderPath.value.trim());
    results.value = importResults;

    const success = importResults.filter(r => r.success).length;
    const total = importResults.length;

    if (success === total) {
      ui.notifications?.info(`Imported ${success} actor(s).`);
    } else if (success > 0) {
      ui.notifications?.warn(`Imported ${success} of ${total} actor(s).`);
    } else {
      ui.notifications?.error("No actors were imported.");
    }
  } catch (error) {
    ui.notifications?.error(error instanceof Error ? error.message : String(error));
  } finally {
    importing.value = false;
  }
}

async function importFromText() {
  const trimmed = jsonText.value.trim();
  if (!trimmed) return;
  const parsed = await parseJsonText(trimmed);
  await runImport(parsed);
}

async function importFromFile() {
  if (!selectedFile.value) return;
  const text = await selectedFile.value.text();
  const parsed = await parseJsonText(text);
  await runImport(parsed);

  if (fileInput.value) fileInput.value.value = "";
  selectedFile.value = null;
}

function closeDialog() {
  props.dialog.close();
}
</script>

<style scoped>
.dw-json-import-dialog {
  padding: 1.5rem;
  min-width: 560px;
  font-family: var(--font-primary, "Signika", serif);
  font-size: 13px;
  color: #444;
  background: #f8f7f4;
}

.dw-json-import-dialog h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-weight: 600;
  border-bottom: 2px solid #9e9a8e;
  padding-bottom: 0.5rem;
}

.dw-json-import-dialog h3 {
  color: #34495e;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.dw-json-import-dialog h3 i {
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

.dw-text-input,
.dw-file-input,
.dw-textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #9e9a8e;
  border-radius: 2px;
  background: white;
  font-family: inherit;
  font-size: 13px;
}

.dw-textarea {
  min-height: 220px;
  resize: vertical;
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

.dw-btn-secondary {
  background: #6c757d;
  color: white;
  border-color: #5a6268;
}

.dw-btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.dw-import-progress {
  padding: 1rem;
  background: rgba(74, 144, 226, 0.1);
  border: 1px solid #4a90e2;
  border-radius: 3px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  max-height: 260px;
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

.dw-result-success {
  border-left: 3px solid #2ecc71;
}

.dw-result-error {
  border-left: 3px solid #e74c3c;
}

.dw-error-text {
  font-size: 11px;
  color: #e74c3c;
  font-style: italic;
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
