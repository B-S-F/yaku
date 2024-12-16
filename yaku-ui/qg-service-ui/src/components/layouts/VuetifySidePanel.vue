<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
    <section ref="panelRef"
        :class="[position, { 'maximized': isMaximized, 'resizable': resizable, 'manual-resize': isManualResizedWith }]">
        <div class="side-panel-header">
            <div class="header">
                <slot name="header" />
            </div>
            <FrogPopover v-if="maximizable" class="btn-popover" pophoverClass="side-panel-resize-popover" attached
                triggerOnHover tooltipAlike arrowPlacementClass="-without-arrow-top"
                :label="isMaximized ? 'Minimize' : 'Maximize'">
                <FrogButton integrated :icon="isMaximized ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
                    @click="isMaximized = !isMaximized" />
            </FrogPopover>
            <FrogButton integrated icon="mdi-window-close" @click="emit('close')" />
        </div>
        <slot />
        <FrogButton v-if="resizable" class="resize-btn" integrated arial-label="resize panel"
            icon="mdi-arrow-split-vertical" @mousedown="setResize" />
    </section>
</template>

<script setup lang="ts">
import { onClickOutside, useEventListener } from '@vueuse/core'
import { ref, watch } from 'vue'

const props = defineProps<{
  /** The origin of the panel. "right"/"left" values direct the panel on the x-axis and "top"/"bottom" on the y-axis. */
  position: 'right'
  /** The panel can be expanded on the axis of its position with a button in the header. */
  maximizable?: boolean
  /** Expand the panel to the size of the window on the axis of its position. */
  openMaximized?: boolean
  /** Allow the user to resize the panel on the axis of its position. */
  resizable?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'click-outside'): void
}>()

const isMaximized = ref(props.maximizable && props.openMaximized)
/** remove the custom resize effect if the user toggles the maximized value */
watch(isMaximized, () => {
  if (!panelRef.value) return
  isManualResizedWith.value = ''
})

const closeOnEsc = (e: KeyboardEvent) => {
  if (e.code === 'Escape') emit('close')
}
useEventListener('keydown', closeOnEsc)

// ----------------
//  Resize feature
// ----------------
const panelRef = ref<HTMLElement>()
const isManualResizedWith = ref<string>('')
const resize = (e: MouseEvent) => {
  if (!panelRef.value) return
  const { x } = panelRef.value.getBoundingClientRect()
  const dx = x - e.x + 6 // half the button size
  const newPos =
    Number.parseInt(getComputedStyle(panelRef.value, '').width) + dx
  isMaximized.value = newPos >= window.innerWidth
  isManualResizedWith.value = `${newPos}px`
}

const setResize = () => document.addEventListener('mousemove', resize, false)
const releaseResize = () =>
  document.removeEventListener('mousemove', resize, false)
useEventListener('mouseup', releaseResize)

onClickOutside(panelRef, () => emit('click-outside'))
</script>

<style scoped lang="scss">
section {
    $padding: 24px;
    position: fixed;
    background-color: #757575;
    border: 1px solid #858585;
    padding-bottom: $padding;

    display: flex;
    flex-flow: column nowrap;

    max-width: var(--view-width);

    &.right {
        right: 0;
        padding-left: $padding;

        &.maximized:not(.custom-width) {
            width: var(--view-width);
        }

        &.manual-resize {
            min-width: var(--panel-min-width, 0);
            width: v-bind(isManualResizedWith);
        }
    }
}

.side-panel-header {
    display: flex;

    .header {
        margin-right: auto;
    }
}

.side-panel-actions {
    align-self: end;
}

.resize-btn {
    $width: 1.7rem;
    $height: 5.4rem;
    padding-top: 5rem;
    padding-bottom: 5rem;
    position: absolute;
    left: 0;
    top: calc(50% - #{$height * 0.5});
    width: $width;
    height: $height;
    cursor: ew-resize;
    background: #e0e2e5;
    border: none;
    border-radius: 4px;
    font-size: small;

    --handle-color: #e0e2e5 // var(--neutral__enabled__front__default);

        &:hover {
        --handle-color: #e0e2e5
    }

    &:active {
        --handle-color: #e0e2e5
    }

    &::before,
    &::after {
        $handleHeight: 0.5rem;
        display: block;
        position: absolute;
        width: 1px;
        height: $handleHeight;
        background-color: var(--handle-color);
        transform: translate(calc($width * 0.5 + var(--from-x-center)), #{($height - $handleHeight) * 0.5})
    }

    &::before {
        --from-x-center: -2px;
    }

    &::after {
        --from-x-center: 0px;
    }
}

:global(.side-panel-resize-popover) {
    --y-shift: 16px;
}
</style>
