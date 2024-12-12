<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <Story>
    <Variant title="Default">
      <FrogFormField>
        <FrogTextInput id="default" v-model="textInputValue" />
      </FrogFormField>
    </Variant>

    <Variant title="Text field with notification">
      <FrogFormField fieldMsg="This is optional">
        <FrogTextInput id="with-notification" v-model="textInputValue" />
      </FrogFormField>
    </Variant>

    <Variant title="Text field with success notification">
      <FrogFormField notificationType="success"
        fieldMsg="Good job! Lorem ipsum dolor, sit amet consectetur adipisicing elit. Nobis architecto illum eveniet molestiae dicta neque aut sapiente voluptate atque, voluptatum illo! Ad fugit harum enim.">
        <FrogTextInput id="with-success-notification" v-model="textInputValue" />
      </FrogFormField>
    </Variant>

    <Variant title="Text area with warning notification">
      <FrogFormField notificationType="warning" fieldMsg="This might be bad.">
        <FrogTextarea id="with-warning-notification" v-model="textInputValue" />
      </FrogFormField>
    </Variant>

    <Variant title="Checkbox with warning notification">
      <FrogFormField type="checkbox" notificationType="error" fieldMsg="This is bad and you need to do something.">
        <FrogCheckbox v-model="checkboxInputValue" label="Checkbox Label" name="with-error-notification" />
      </FrogFormField>
    </Variant>

    <!-- TODO: implement the radio button when ready -->

    <Variant title="Dropdown with notification">
      <FrogFormField type="dropdown" fieldMsg="This is optional.">
        <FrogDropdown id="dropdown-with-notification" v-model="selectedItemInDropdown" :items="DROPDOWN_ITEMS" />
      </FrogFormField>
    </Variant>

    <Variant title="Toggle switch with notification">
      <FrogFormField type="toggle"
        :fieldMsg="toggleSwitchState ? 'It consumes electricity.' : 'Nobody sees a thing in this room.'">
        <FrogToggleSwitch id="dropdown-with-notification" v-model="toggleSwitchState" label="Turn the light on" />
      </FrogFormField>
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import FrogFormField from '../FrogFormField.vue'
import FrogTextInput from '../../atoms/FrogTextInput.vue'
import FrogTextarea from '../../atoms/FrogTextarea.vue'
import FrogCheckbox from '../../atoms/FrogCheckbox.vue'
import FrogDropdown from '../../atoms/FrogDropdown.vue'
import FrogToggleSwitch from '../../atoms/FrogToggleSwitch.vue'

const textInputValue = ref('')
const checkboxInputValue = ref(false)

const selectedItemInDropdown = ref()
const DROPDOWN_ITEMS = [
  { label: 'Option 1', value: '1' },
  { label: 'Option 2', value: '2' },
  { label: 'Option 3', value: '3' },
]

const toggleSwitchState = ref(true)
</script>
