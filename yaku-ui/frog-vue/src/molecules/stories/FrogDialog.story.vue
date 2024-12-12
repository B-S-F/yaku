<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <Story>
    <Variant title="default">
      <FrogDialog id="default" open>
        <template #headline>
          <h2>Dialog headline</h2>
        </template>
        <template #body>
          <p>Dialog body</p>
        </template>
        <template #actions>
          <FrogButton variant="outlined">
            Optional button
          </FrogButton>
          <FrogButton>Confirm</FrogButton>
          <FrogButton secondary>
            cancel
          </FrogButton>
        </template>
      </FrogDialog>
    </Variant>
    <Variant title="with title">
      <FrogDialog id="with title" title="Dialog box title" open>
        <template #headline>
          <h2>Dialog headline</h2>
        </template>
        <template #body>
          <p>Dialog body</p>
        </template>
        <template #actions>
          <FrogButton secondary>
            Optional button
          </FrogButton>
          <FrogButton>Confirm</FrogButton>
          <FrogButton secondary>
            cancel
          </FrogButton>
        </template>
      </FrogDialog>
    </Variant>
    <Variant title="with long title">
      <FrogDialog id="with title" :title="lorem" open>
        <template #headline>
          <h2>Dialog headline</h2>
        </template>
        <template #body>
          <p>Dialog body</p>
        </template>
        <template #actions>
          <FrogButton secondary>
            Optional button
          </FrogButton>
          <FrogButton>Confirm</FrogButton>
          <FrogButton secondary>
            cancel
          </FrogButton>
        </template>
      </FrogDialog>
    </Variant>
    <Variant title="not closeable">
      <FrogDialog id="not closeable" hideCloseBtn open>
        <template #headline>
          <h2>Dialog headline</h2>
        </template>
        <template #body>
          <p>Dialog body</p>
        </template>
        <template #actions>
          <FrogButton secondary>
            Optional button
          </FrogButton>
          <FrogButton>Confirm</FrogButton>
          <FrogButton secondary>
            cancel
          </FrogButton>
        </template>
      </FrogDialog>
    </Variant>
    <Variant title="with long title not closeable">
      <FrogDialog id="with long title not closeable" :title="lorem" hideCloseBtn open>
        <template #headline>
          <h2>Dialog headline</h2>
        </template>
        <template #body>
          <p>Dialog body</p>
        </template>
        <template #actions>
          <FrogButton secondary>
            Optional button
          </FrogButton>
          <FrogButton>Confirm</FrogButton>
          <FrogButton secondary>
            cancel
          </FrogButton>
        </template>
      </FrogDialog>
    </Variant>
    <Variant title="without header">
      <FrogDialog id="without header" hideHeader open>
        <template #headline>
          <h2>Dialog headline</h2>
        </template>
        <template #body>
          <p>Dialog body</p>
        </template>
        <template #actions>
          <FrogButton secondary>
            Optional button
          </FrogButton>
          <FrogButton>Confirm</FrogButton>
          <FrogButton secondary>
            cancel
          </FrogButton>
        </template>
      </FrogDialog>
    </Variant>
    <Variant title="info">
      <FrogDialog id="info" title="Info Title Text M Bold" type="info" open>
        <template #headline>
          <h2>Dialog headline</h2>
        </template>
        <template #body>
          <p>Dialog body</p>
        </template>
        <template #actions>
          <FrogButton secondary>
            Optional button
          </FrogButton>
          <FrogButton>Confirm</FrogButton>
          <FrogButton secondary>
            cancel
          </FrogButton>
        </template>
      </FrogDialog>
    </Variant>
    <Variant title="warning">
      <FrogDialog id="warning" title="Warning Title Text M Bold" type="warning" open>
        <template #headline>
          <h2>Dialog headline</h2>
        </template>
        <template #body>
          <p>Dialog body</p>
        </template>
        <template #actions>
          <FrogButton secondary>
            Optional button
          </FrogButton>
          <FrogButton>Confirm</FrogButton>
          <FrogButton secondary>
            cancel
          </FrogButton>
        </template>
      </FrogDialog>
    </Variant>
    <Variant title="success">
      <FrogDialog id="success" title="Success Title Text M Bold" type="success" open>
        <template #headline>
          <h2>Dialog headline</h2>
        </template>
        <template #body>
          <p>Dialog body</p>
        </template>
        <template #actions>
          <FrogButton secondary>
            Optional button
          </FrogButton>
          <FrogButton>Confirm</FrogButton>
          <FrogButton secondary>
            cancel
          </FrogButton>
        </template>
      </FrogDialog>
    </Variant>
    <Variant title="error">
      <FrogDialog id="error" title="Success Title Text M Bold" type="error" open>
        <template #headline>
          <h2>Dialog headline</h2>
        </template>
        <template #body>
          <p>Dialog body</p>
        </template>
        <template #actions>
          <FrogButton secondary>
            Optional button
          </FrogButton>
          <FrogButton>Confirm</FrogButton>
          <FrogButton secondary>
            cancel
          </FrogButton>
        </template>
      </FrogDialog>
    </Variant>
    <Variant title="info without close button">
      <FrogDialog id="info without close button" title="Info Title Text M Bold" type="info" hideCloseBtn open>
        <template #headline>
          <h2>Dialog headline</h2>
        </template>
        <template #body>
          <p>Dialog body</p>
        </template>
        <template #actions>
          <FrogButton secondary>
            Optional button
          </FrogButton>
          <FrogButton>Confirm</FrogButton>
          <FrogButton secondary>
            cancel
          </FrogButton>
        </template>
      </FrogDialog>
    </Variant>
    <Variant title="warning without close button">
      <FrogDialog id="warning without close button" title="Warning Title Text M Bold" type="warning" hideCloseBtn open>
        <template #headline>
          <h2>Dialog headline</h2>
        </template>
        <template #body>
          <p>Dialog body</p>
        </template>
        <template #actions>
          <FrogButton secondary>
            Optional button
          </FrogButton>
          <FrogButton>Confirm</FrogButton>
          <FrogButton secondary>
            cancel
          </FrogButton>
        </template>
      </FrogDialog>
    </Variant>
    <Variant title="success without close button">
      <FrogDialog id="success without close button" title="Success Title Text M Bold" type="success" hideCloseBtn open>
        <template #headline>
          <h2>Dialog headline</h2>
        </template>
        <template #body>
          <p>Dialog body</p>
        </template>
        <template #actions>
          <FrogButton secondary>
            Optional button
          </FrogButton>
          <FrogButton>Confirm</FrogButton>
          <FrogButton secondary>
            cancel
          </FrogButton>
        </template>
      </FrogDialog>
    </Variant>
    <Variant title="error without close button">
      <FrogDialog id="error without close button" open title="Success Title Text M Bold" type="error" hideCloseBtn>
        <template #headline>
          <h2>Dialog headline</h2>
        </template>
        <template #body>
          <p>Dialog body</p>
        </template>
        <template #actions>
          <FrogButton secondary>
            Optional button
          </FrogButton>
          <FrogButton>Confirm</FrogButton>
          <FrogButton secondary>
            cancel
          </FrogButton>
        </template>
      </FrogDialog>
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import FrogDialog from '../FrogDialog.vue'
import FrogButton from '../../atoms/FrogButton.vue'

const lorem =
  'Lorem ipsum dolor sit amet consectetur adipisicing elit. Laborum accusantium incidunt porro veniam dolor a, assumenda earum iste aliquam mollitia debitis voluptates! Adipisci nesciunt voluptate porro tempora maxime nihil debitis.'
</script>
