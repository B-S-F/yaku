// SPDX-FileCopyrightText: 2024 grow platform GmbH
//
// SPDX-License-Identifier: MIT

/**
 * Vuetify
 */
import FrogAccordion from './atoms/FrogAccordion.vue'
import FrogActivityIndicator from './atoms/FrogActivityIndicator.vue'
import FrogButton from './atoms/FrogButton.vue'
import FrogCheckbox from './atoms/FrogCheckbox.vue'
import FrogChip from './atoms/FrogChip.vue'
import FrogDropdown from './atoms/FrogDropdown.vue'
import FrogDropzone from './atoms/FrogDropzone.vue'
import FrogFileUpload from './atoms/FrogFileUpload.vue'
import FrogIcon from './atoms/FrogIcon.vue'
import FrogMenuItem from './atoms/FrogMenuItem.vue'
import FrogNotificationBar from './atoms/FrogNotificationBar.vue'
import FrogProgressIndicator from './atoms/FrogProgressIndicator.vue'
import FrogRadioButton from './atoms/FrogRadioButton.vue'
import FrogScrollbar from './atoms/FrogScrollbar.vue'
import FrogTabNavigation from './atoms/FrogTabNavigation.vue'
import FrogTextarea from './atoms/FrogTextarea.vue'
import FrogTextInput from './atoms/FrogTextInput.vue'
import FrogTile from './atoms/FrogTile.vue'
import FrogToggleSwitch from './atoms/FrogToggleSwitch.vue'
import FrogTooltip from './atoms/FrogTooltip.vue'
import FrogValueModificator from './atoms/FrogValueModificator.vue'

/**
 * Vuetify
 */
import FrogDialog from './molecules/FrogDialog.vue'
import FrogFormField from './molecules/FrogFormField.vue'
import FrogPopover from './molecules/FrogPopover.vue'
import FrogSideNavigation from './molecules/FrogSideNavigation.vue'
import FrogSteps from './molecules/FrogSteps.vue'

/**
 * Vuetify
 */
import FrogHeader from './organisms/FrogHeader'
import FrogMinimalHeader from './organisms/FrogMinimalHeader.vue'

export const components = {
  /**
   * Vuetify
   */
  // Atoms
  FrogAccordion,
  FrogActivityIndicator,
  FrogButton,
  FrogCheckbox,
  FrogChip,
  FrogDropdown,
  FrogDropzone,
  FrogFileUpload,
  FrogIcon,
  FrogMenuItem,
  FrogNotificationBar,
  FrogProgressIndicator,
  FrogRadioButton,
  FrogScrollbar,
  FrogTabNavigation,
  FrogTextarea,
  FrogTextInput,
  FrogTile,
  FrogToggleSwitch,
  FrogTooltip,
  FrogValueModificator,
  // Molecules
  FrogDialog,
  FrogFormField,
  FrogPopover,
  FrogSideNavigation,
  FrogSteps,
  // Organisms
  FrogHeader,
  FrogMinimalHeader,
} as const
