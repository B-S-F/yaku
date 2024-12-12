<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <Story>
    <Variant title="simple label (default with no icons)">
      <Link label="Link label" href="https://www.example.com" />
    </Variant>
    <Variant title="primary label (default with icon right)">
      <Link icon="forward-right-small" label="Link label" href="https://www.example.com" />
    </Variant>
    <Variant title="primary label (default with icon right)">
      <Link icon="emoji-happy" iconLeft label="Link label" href="https://www.example.com" />
    </Variant>
    <Variant title="primary label disabled with icon right">
      <Link disabled icon="forward-right-small" label="Link label" href="https://www.example.com" />
    </Variant>
    <Variant title="integrated label">
      <Link type="integrated" label="Link label" href="https://www.example.com" />
    </Variant>
    <Variant title="size S">
      <Link class="-size-s" label="Link label" href="https://www.example.com" />
    </Variant>
    <Variant title="size M">
      <Link class="-size-m" label="Link label" href="https://www.example.com" />
    </Variant>
    <Variant title="size L">
      <Link class="-size-l" label="Link label" href="https://www.example.com" />
    </Variant>
    <Variant title="size XL">
      <Link class="-size-xl" label="Link label" href="https://www.example.com" />
    </Variant>
    <Variant title="size 2XL">
      <Link class="-size-2xl" label="Link label" href="https://www.example.com" />
    </Variant>
    <Variant title="size 3XL">
      <Link class="-size-3xl" label="Link label" href="https://www.example.com" />
    </Variant>
    <Variant title="size 4XL">
      <Link class="-size-4xl" label="Link label" href="https://www.example.com" />
    </Variant>
    <Variant title="size 5XL">
      <Link class="-size-5xl" label="Link label" href="https://www.example.com" />
    </Variant>
    <Variant title="size 6XL">
      <Link class="-size-6xl" label="Link label" href="https://www.example.com" />
    </Variant>
    <Variant title="look-alike primary button">
      <Link type="button-primary" label="Link label" href="https://www.example.com" />
    </Variant>
    <Variant title="look-alike secondary button">
      <Link type="button-secondary" label="Link label" href="https://www.example.com" />
    </Variant>
    <Variant title="Line break demo behavior">
      <div style="width:400px;display:flex;flex-wrap:wrap">
        <p style="flex:0 0 100%">
          Inside fixed-width containers
        </p>
        <div style="padding-right:1rem;flex:1 0 50%">
          <Link href="#" icon="emoji-happy" iconLeft
            label="Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy" />
        </div>
        <div style="padding-left:1rem;flex:1 0 50%">
          <Link href="#" icon="emoji-happy"
            label="Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy" />
        </div>
        <br>
        <p>Auto width</p>
        <br>
      </div>
      <Link href="#" icon="emoji-happy" iconLeft
        label="Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy" />
      <br>
      <Link href="#" icon="emoji-happy"
        label="Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy" />
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import Link from '../Link.vue'
</script>
