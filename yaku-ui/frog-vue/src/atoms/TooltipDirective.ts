// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

import type { Directive } from 'vue'
import type { TooltipProps } from '../types/TooltipProps'

// TODO: Migrate?

const setPropsToDataAttrs = (el: HTMLElement, props: TooltipProps) => {
  if (!props.label) {
    el.removeAttribute('data-tooltip')
    el.removeAttribute('data-tooltip-width')
    el.removeAttribute('data-tooltip-type')
  } else {
    el.dataset.tooltip = props.label
    el.dataset.tooltipWidth = props.width
    el.dataset.tooltipType = props.type ?? 'neutral'
  }
}

export const TooltipDirective: Directive<HTMLElement, TooltipProps> = {
  created(el, { value: props }) {
    // populate element with class to "enable" the tooltip
    el.classList.add('frontend-kit-example__hovering-tooltip')
    if (props.label) {
      setPropsToDataAttrs(el, props)
    }
  },
  beforeMount() {},
  mounted() {},
  beforeUpdate(el, { value: props }) {
    setPropsToDataAttrs(el, props)
  },
  updated() {},
  beforeUnmount() {},
  unmounted() {},
}
