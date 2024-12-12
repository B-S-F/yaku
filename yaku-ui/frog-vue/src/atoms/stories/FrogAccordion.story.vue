<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <Story>
    <Variant title="default">
      <FrogAccordion headline="Accordion" :initial-open="false" :openable="true">
        <template #content>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Ratione
          quibusdam blanditiis recusandae labore veritatis, rem at voluptates
          vero reprehenderit tempore?
        </template>
      </FrogAccordion>
    </Variant>

    <Variant title="small">
      <FrogAccordion headline="Accordion" :small="true">
        <template #content>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Ratione
          quibusdam blanditiis recusandae labore veritatis, rem at voluptates
          vero reprehenderit tempore?
        </template>
      </FrogAccordion>
    </Variant>

    <Variant title="open">
      <FrogAccordion headline="Accordion" :initial-open="true">
        <template #content>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Ratione
          quibusdam blanditiis recusandae labore veritatis, rem at voluptates
          vero reprehenderit tempore?
        </template>
      </FrogAccordion>
    </Variant>


    <Variant title="Not openable">
      <FrogAccordion headline="Accordion" :openable="false">
        <template #content>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Ratione
          quibusdam blanditiis recusandae labore veritatis, rem at voluptates
          vero reprehenderit tempore?
        </template>
      </FrogAccordion>
    </Variant>

    <Variant title="Not Clickable - (only through button)">
      <FrogAccordion :initial-open="true" headline="Accordion" :clickable="false">
        <template #content>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Ratione
          quibusdam blanditiis recusandae labore veritatis, rem at voluptates
          vero reprehenderit tempore?
        </template>
      </FrogAccordion>
    </Variant>

    <Variant title="multi">
      <FrogAccordion headline="Accordion 1" :initial-open="true">
        <template #content>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Ratione
          quibusdam blanditiis recusandae labore veritatis, rem at voluptates
          vero reprehenderit tempore?
        </template>
      </FrogAccordion>

      <FrogAccordion headline="Accordion 2">
        <template #content>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Ratione
          quibusdam blanditiis recusandae labore veritatis, rem at voluptates
          vero reprehenderit tempore?
        </template>
      </FrogAccordion>

      <FrogAccordion headline="Accordion 2">
        <template #content>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Ratione
          quibusdam blanditiis recusandae labore veritatis, rem at voluptates
          vero reprehenderit tempore?
        </template>
      </FrogAccordion>

      <FrogAccordion headline="Accordion 4" :initial-open="true">
        <template #content>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Ratione
          quibusdam blanditiis recusandae labore veritatis, rem at voluptates
          vero reprehenderit tempore?
        </template>
      </FrogAccordion>
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import FrogAccordion from '../FrogAccordion.vue'
</script>

<style lang="scss"></style>
