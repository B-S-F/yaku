<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <main>
    <article>
      <header>
        <h1 class="font-weight-bold">OSS Compliance Information</h1>
        <div class="file-details">
          <div class="base">
            <h2 class="title font-weight-bold">
              Details
            </h2>
            <ul class="semantic-list fields">
              <li v-for="(val, key) in base" :key="key" class="item">
                <span>{{ key }} </span>
                <span>{{ val }}</span>
              </li>
            </ul>
          </div>
          <div class="metadata">
            <h2 class="title font-weight-bold">
              Metadata
            </h2>
            <ul class="semantic-list fields">
              <li class="item">
                <span> Timestamp </span>
                <span>{{ metadata.timestamp }}</span>
              </li>
              <li class="item">
                <span>Authors</span>
                <div class="multiple-rows">
                  <span v-for="(author, index) in metadata.authors" :key="index">
                    <a :href="author.url" target="_blank">{{ author.name }}</a>
                    <span>
                      Contact(s):
                      <template v-for="contact, i in author.contact" :key="contact.name">
                        <a :href="`mailto:${contact.email}`">
                          {{ contact.name }} &lt;{{ author.contact[0].email }}&gt;</a>
                        <span v-if="i > 0">, </span>
                      </template>
                    </span>
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </header>
      <ul class="semantic-list dependencies">
        <li v-for="(component, index) in components" :key="index">
          <VuetifyOssComplianceItem :component="component" />
        </li>
      </ul>
    </article>
  </main>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import { computed } from 'vue'
import sbomData from '~/assets/cycloneDX-SBOM.json'
import type { Component } from '~/types'
import { useRecentDateFormat } from '~composables'

const base = computed(() => ({
  'BOM Format': sbomData.bomFormat,
  'Specifications Version': sbomData.specVersion,
  Version: sbomData.version,
  'Serial Number': sbomData.serialNumber,
}))

const metadata = computed(() => ({
  timestamp: useRecentDateFormat(new Date(sbomData.metadata.timestamp), {
    forceDateString: true,
  }),
  authors: [sbomData.metadata.manufacture],
}))

const components: Ref<Component[]> = computed(() =>
  sbomData.components.map((component) => ({
    ...component,
    copyright: new Set(
      component.copyright
        .split(/,*copyright/gi)
        .map((val) => val.replace(/copyright/gi, ''))
        .filter((val) => val !== ''),
    ),
  })),
)
</script>

<style scoped lang="scss">
@use '../../styles/components/oss-compliance.scss' as *;

main {
  --border-color: #EEEEEE; // grey-lighten-3

  background-color: #F5F5F5; // grey-lighten-4
  height: 100vh;
  overflow: auto;
  padding: 4vh 4vw;
}

.-dark-mode {
  main {
    --border-color: #BDBDBD; // grey-lighten-1

    background-color: var(--v-theme-background);
  }
}

article {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

h1 {
  font-size: 2rem;
}

.file-details {
  display: flex;
  gap: $spacing-16;

  >* {
    padding: $padding-component-m;
    background-color: var(--background);
  }

  .title {
    font-size: 1.25rem;
    padding-bottom: $space-component-l;
    border-bottom: solid 1px var(--border-color);
    margin-top: 0;
  }

  .base {
    flex-grow: 1;
  }

  @media screen and (max-width: 1160px) {
    flex-direction: column;
  }
}

.dependencies {
  display: flex;
  flex-direction: column;
  gap: $space-component-m;
  outline: 0;

  &>li {
    background-color: var(--background);
    padding: $padding-component-m;
    display: flex;
    flex-direction: column;
    gap: $space-component-l;
  }
}
</style>
