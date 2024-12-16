<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <Story>
    <!-- Added centered divs with padding for better visualization of left-shifted popovers -->
    <Variant title="default">
      <div class="centered">
        <FrogPopover show label="default" />
      </div>
    </Variant>
    <Variant title="increased max width">
      <div class="centered">
        <FrogPopover show label="standard max width: abcdefghijklmnopqrstuvwxyznhdkjhfdsjhlkjhfdskjhfdskjhkjhfdslkjhfdslkjhfdsa" />
      </div>
      <p style="margin-bottom:3cm;" />
      <div class="centered">
        <FrogPopover show label="extended max width: abcdefghijklmnopqrstuvwxyznhdkjhfdsjhlkjhfdskjhfdskjhkjhfdslkjhfdslkjhfdsa" maxWidth="32rem" />
      </div>
    </Variant>
    <Variant title="with headline">
      <div class="centered">
        <FrogPopover show label="with headline">
          <template #headline>
            Headline
          </template>
          <template #content>
            Content
          </template>
        </FrogPopover>
      </div>
    </Variant>
    <Variant title="closeable">
      <div class="centered">
        <FrogButton @click="showClosable = !showClosable">
          Trigger Popover
        </FrogButton>
        <FrogPopover activator="#trigger-popover" :show="showClosable" label="closeable popup" closeable
          @close="showClosable = false" />
      </div>
    </Variant>
    <Variant title="closeable with action button">
      <div class="centered">
        <FrogPopover show label="closeable popup with action button" closeable actionLabel="Learn more" />
      </div>
    </Variant>
    <Variant title="arrow top left">
      <div class="centered">
        <FrogPopover show :label="lorem" arrowPlacementClass="-top-left" />
      </div>
    </Variant>
    <Variant title="arrow top center">
      <div class="centered">
        <FrogPopover show :label="lorem" arrowPlacementClass="-top-center" />
      </div>
    </Variant>
    <Variant title="arrow top right">
      <div class="centered">
        <FrogPopover show :label="lorem" arrowPlacementClass="-top-right" />
      </div>
    </Variant>
    <Variant title="arrow bottom left">
      <div class="centered">
        <FrogPopover show :label="lorem" arrowPlacementClass="-bottom-left" />
      </div>
    </Variant>
    <Variant title="arrow bottom center">
      <div class="centered">
        <FrogPopover show :label="lorem" arrowPlacementClass="-bottom-center" />
      </div>
    </Variant>
    <Variant title="arrow bottom right">
      <div class="centered">
        <FrogPopover show :label="lorem" arrowPlacementClass="-bottom-right" />
      </div>
    </Variant>
    <Variant title="arrow left top">
      <div class="centered">
        <FrogPopover show :label="lorem" arrowPlacementClass="-left-top" />
      </div>
    </Variant>
    <Variant title="arrow left center">
      <div class="centered">
        <FrogPopover show :label="lorem" arrowPlacementClass="-left-center" />
      </div>
    </Variant>
    <Variant title="arrow left bottom">
      <div class="centered">
        <FrogPopover show :label="lorem" arrowPlacementClass="-left-bottom" />
      </div>
    </Variant>
    <Variant title="arrow right top">
      <div class="centered">
        <FrogPopover show :label="lorem" arrowPlacementClass="-right-top" />
      </div>
    </Variant>
    <Variant title="arrow right center">
      <div class="centered">
        <FrogPopover show :label="lorem" arrowPlacementClass="-right-center" />
      </div>
    </Variant>
    <Variant title="arrow right bottom">
      <div class="centered">
        <FrogPopover show :label="lorem" arrowPlacementClass="-right-bottom" />
      </div>
    </Variant>
    <Variant title="without arrow bottom">
      <div class="centered">
        <FrogPopover show :label="lorem" arrowPlacementClass="-without-arrow-bottom" />
      </div>
    </Variant>
    <Variant title="Tooltip alike">
      <h2>Without arrows</h2>
      <div class="centered">
        <FrogPopover show :label="lorem" tooltipAlike arrowPlacementClass="-without-arrow-top" />
      </div>
      <h2>With arrows</h2>
      <div class="left">
        <FrogPopover show attached :label="lorem" tooltipAlike arrowPlacementClass="-top-left" />
      </div>
    </Variant>
    <Variant title="Hoverable">
      <div class="centered">
        <FrogPopover attached triggerOnHover :label="lorem" arrowPlacementClass="-without-arrow-bottom">
          <p>Hover me</p>
        </FrogPopover>
      </div>
    </Variant>
    <Variant title="Hoverable Custom content">
      <div class="centered">
        <FrogPopover attached triggerOnHover>
          <p>Hover me</p>
          <template #content>
            <div style="display: flex; flex-direction: column; align-items: center; row-gap: 1rem">
              <span>Content</span>
              <FrogButton>
                Action btn
              </FrogButton>
            </div>
          </template>
        </FrogPopover>
      </div>
    </Variant>
    <Variant title="Attached">
      <div class="attachment-container">
        <FrogPopover attached closeable :show="showAttached" :label="frokLorem" actionLabel="Click me"
          @action="showAttached = false" @close="showAttached = false">
          <FrogButton secondary @click="showAttached = true">
            click me
          </FrogButton>
        </FrogPopover>
      </div>
    </Variant>
    <Variant title="Gallery of attachment popover">
      <div class="attachment-container">
        <FrogPopover v-for="attachmentType in ATTACHMENTS" :key="attachmentType" attached closeable
          label="Paragraph Text View standard regular Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy."
          actionLabel="Close Me" :arrowPlacementClass="attachmentType" :show="showAttachments.has(attachmentType)"
          @action="showAttachments.delete(attachmentType)" @close="showAttachments.delete(attachmentType)">
          <FrogButton secondary @click="showAttachments.add(attachmentType)">
            {{ attachmentType.slice(1) }}
          </FrogButton>
        </FrogPopover>
      </div>
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import FrogPopover from '../FrogPopover.vue'
import FrogButton from '../../atoms/FrogButton.vue'
import type { ArrowPlacement } from '../../types'
import { reactive, ref } from 'vue'

const lorem =
  'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod.'
const frokLorem =
  'Paragraph Text View standard regular Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy.'

const showClosable = ref(true)
const showAttached = ref(false)

const ATTACHMENTS: ArrowPlacement[] = [
  '-top-left',
  '-top-center',
  '-top-right',
  '-bottom-left',
  '-bottom-center',
  '-bottom-right',
  '-left-top',
  '-left-center',
  '-left-bottom',
  '-right-top',
  '-right-center',
  '-right-bottom',
  '-without-arrow-top',
  '-without-arrow-bottom',
]
const showAttachments = reactive(new Set<ArrowPlacement>())
</script>

<style lang="scss" scoped>
.centered,
.left {
  padding: 1rem;
  height: fit-content;
  display: flex;
  flex-flow: column;
}

.centered {
  align-items: center;
}

.left {
  justify-content: start;
}

.flow-center {
  display: flex;
  flex-flow: column;
  align-items: center;
}

.attachment-container {
  padding: 1rem;
  display: flex;
  flex-flow: column;
  align-items: center;
  row-gap: 1rem;
}
</style>
