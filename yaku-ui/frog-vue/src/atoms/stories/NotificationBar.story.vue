<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
    <Story>
        <Variant title="default">
            <NotificationBar
                :show="true"
                type="neutral"
            >
            Default notification bar
            </NotificationBar>
        </Variant>
        <Variant title="default with icon">
            <NotificationBar
                :show="true"
                type="neutral"
                :withIcon="true"
                customIcon="emoji-happy"
            >
            Default notification bar with icon
            </NotificationBar>
        </Variant>
        <Variant title="full width">
            <NotificationBar
                :show="true"
                type="neutral"
                fullWidth
            >
            Full width notification bar
            </NotificationBar>
        </Variant>
        <Variant title="warning with icon">
            <NotificationBar
                :show="true"
                type="warning"
                fullWidth
                :withIcon="true"
            >
            Warning notification bar with icon
            </NotificationBar>
        </Variant>
        <Variant title="error with icon">
            <NotificationBar
                :show="true"
                type="error"
                fullWidth
                :withIcon="true"
            >
            Error notification bar with icon
            </NotificationBar>
        </Variant>
        <Variant title="success with icon">
            <NotificationBar
                :show="true"
                type="success"
                fullWidth
                :withIcon="true"
            >
            Success notification bar with icon
            </NotificationBar>
        </Variant>
        <Variant title="success with custom icon">
            <NotificationBar
                :show="true"
                type="success"
                fullWidth
                :withIcon="true"
                customIcon="emoji-happy"
            >
            Success notification bar with custom icon
            </NotificationBar>
        </Variant>
        <Variant title="success with centered icon">
            <NotificationBar
                :show="true"
                type="success"
                fullWidth
                :withIcon="true"
                centerIcon
            >
            Success notification bar with centered icon.
            Longer text showing that the icon is centered.
            This text is looooooooooooooooooooooooooooooooooong.
            </NotificationBar>
        </Variant>
        <Variant title="variant banner">
            <NotificationBar
                :show="true"
                type="neutral"
                fullWidth
                variant="banner"
            >
            Notification banner
            </NotificationBar>
        </Variant>
        <Variant title="variant banner with icon">
            <NotificationBar
                :show="true"
                type="neutral"
                fullWidth
                withIcon
                customIcon="emoji-happy"
                variant="banner"
            >
            Notification banner with icon
            </NotificationBar>
        </Variant>
        <Variant title="variant banner success with icon">
            <NotificationBar
                :show="true"
                type="success"
                fullWidth
                :withIcon="true"
                variant="banner"
            >
            Success notification banner with icon
            </NotificationBar>
        </Variant>
        <Variant title="variant banner warning with icon">
            <NotificationBar
                :show="true"
                type="warning"
                withIcon
                fullWidth
                variant="banner"
            >
            Warning notification banner with icon
            </NotificationBar>
        </Variant>
        <Variant title="variant banner error with icon">
            <NotificationBar
                :show="true"
                type="error"
                fullWidth
                :withIcon="true"
                variant="banner"
            >
            Error notification banner with icon
            </NotificationBar>
        </Variant>
    </Story>
</template>

<script setup lang="ts">
import NotificationBar from '../NotificationBar.vue'
</script>
