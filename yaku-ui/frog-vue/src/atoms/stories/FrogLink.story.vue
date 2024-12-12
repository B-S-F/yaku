<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
    <Story>
      <Variant title="simple label (default with no icons)">
        <FrogLink label="Simple Label" href="https://example.com/"/>
      </Variant>
      <Variant title="primary label (default with icon right)">
        <FrogLink label="Link Label" icon="mdi-emoticon" :iconLeft="false" href="https://www.example.com"/>
      </Variant>
      <Variant title="primary label (default with icon right)">
        <FrogLink label="Link label" icon="mdi-emoticon" iconLeft href="https://www.example.com"/>
      </Variant>
      <Variant title="primary label disabled with icon right">
        <FrogLink label="Link Label" icon="mdi-emoticon" :iconLeft="false" href="https://www.example.com" :disabled="true"/>
      </Variant>
      <Variant title="integrated label">
        <FrogLink label="Link Label" type="integrated" href="https://www.example.com"/>
      </Variant>
      <Variant title="size S">
        <FrogLink class="text-caption" label="Link Label" href="https://www.example.com"/>
      </Variant>
      <Variant title="size M">
        <FrogLink class="text-body-2" label="Link Label" href="https://www.example.com"/>
      </Variant>
      <Variant title="size L">
        <FrogLink class="text-body-1" label="Link Label" href="https://www.example.com"/>
      </Variant>
      <Variant title="size XL">
        <FrogLink class="text-h6" label="Link Label" href="https://www.example.com"/>
      </Variant>
      <Variant title="size 2XL">
        <FrogLink class="text-h5" label="Link Label" href="https://www.example.com"/>
      </Variant>
      <Variant title="size 3XL">
        <FrogLink class="text-h4" label="Link Label" href="https://www.example.com"/>
      </Variant>
      <Variant title="size 4XL">
        <FrogLink class="text-h3" label="Link Label" href="https://www.example.com"/>
      </Variant>
      <Variant title="size 5XL">
        <FrogLink class="text-h2" label="Link Label" href="https://www.example.com"/>
      </Variant>
      <Variant title="size 6XL">
        <FrogLink class="text-h1" label="Link Label" href="https://www.example.com"/>
      </Variant>
      <Variant title="look-alike primary button">
        <FrogLink type="button-primary" label="Link label" href="https://www.example.com" />
      </Variant>
      <Variant title="look-alike secondary button">
        <FrogLink type="button-secondary" label="Link label" href="https://www.example.com" />
      </Variant>
      <Variant title="Line break demo behavior">
        <div style="width:400px;display:flex;flex-wrap:wrap">
          <p style="flex:0 0 100%">
  Inside fixed-width containers
  </p>
          <div style="padding-right:1rem;flex:1 0 50%">
            <FrogLink href="#" icon="mdi-emoticon" iconLeft
              label="Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy" />
          </div>
          <div style="padding-left:1rem;flex:1 0 50%">
            <FrogLink href="#" icon="mdi-emoticon"
              label="Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy" />
          </div>
          <br>
          <p>Auto width</p>
          <br>
        </div>
        <FrogLink href="#" icon="mdi-emoticon" iconLeft
          label="Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy" />
        <br>
        <FrogLink href="#" icon="mdi-emoticon"
          label="Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy" />
      </Variant>
    </Story>
  </template>

  <script setup lang="ts">
import FrogLink from '../FrogLink.vue'
</script>
