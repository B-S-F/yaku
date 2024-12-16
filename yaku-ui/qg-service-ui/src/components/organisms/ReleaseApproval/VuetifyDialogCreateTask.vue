<!--
SPDX-FileCopyrightText: 2024 grow platform GmbH

SPDX-License-Identifier: MIT
-->

<template>
  <VuetifyBlurBackground>
    <FrogDialog v-bind="$attrs" id="createTaskDialog" title="Create task" open class="" @close="emit('close')">
      <template #body>
        <div class="create-task-form">
          <section class="assignees">
            <header>
              <p class="font-weight-bold">
                Assignees
              </p>
              <FrogButton tertiary icon="mdi-refresh" :disabled="taskFormData.assignees.length === 0 || task?.closed"
                @click="handleResetAssignees">
                Clear All
              </FrogButton>
            </header>
            <FrogDropdown id="add-assignee" class="add-assignee" :modelValue="{ label: '', value: 'Add assignee' }"
              :disabled="!users.length" :items="users" @update:model-value="onSelectAssignee($event.value as string)" />
            <ul v-if="displayUsers.length" class="assignees-list">
              <li v-for="user in displayUsers" :key="user.id">
                <VuetifyApproverListItem :username="user.displayName">
                  <template #actions>
                    <FrogButton integrated icon="mdi-trash-can-outline" :disabled="task?.closed"
                      @click="handleRemoveAssignee(user.id)" />
                  </template>
                </VuetifyApproverListItem>
              </li>
            </ul>
          </section>
          <section class="general">
            <template v-if="enterTitle && enterDescription">
              <FrogTextInput v-if="taskFormData.title" id="task-title" v-model="taskFormData.title" type="text"
                placeholder="e.g.: Check config for errors" label="Task title*" class="flex-1" required
                :disabled="task?.closed" />
              <FrogTextarea v-if="taskFormData.description" id="task-description" v-model="taskFormData.description"
                label="Task description" placeholder="Add a short and concise task description."
                :disabled="task?.closed" />
            </template>
            <FrogTextInput id="task-due-date" v-model="taskFormData.dueDate" type="date" placeholder="Selected date"
              label="Due date" :disabled="task?.closed" />
            <FrogDropdown id="task-reminder" label="Receive E-Mail reminders" :items="reminderOptions"
              :model-value="reminderOptions.find(r => r.value === taskFormData.reminder)" :disabled="task?.closed"
              @update:model-value="taskFormData.reminder = $event.value as TaskReminderValue" />
          </section>
        </div>
      </template>
      <template #actions>
        <div v-if="edit && task" class="">
          <FrogButton secondary :icon="task.closed ? 'mdi-sync' : 'mdi-check'"
            @click="task.closed ? emit('reopen-task') : emit('resolve-task')">
            {{ task.closed ? 'Reopen task' : 'Resolve task' }}
          </FrogButton>
        </div>
        <div class="right-side-btns">
          <FrogPopover v-if="edit" arrowPlacementClass="-without-arrow-top"
            :label="task?.closed ? 'Please reopen the task to make any changes' : 'Please complete all required information before you can proceed'"
            trigger-on-hover tooltip-alike attached :deactivate="!isValidTask">
            <FrogButton :disabled="!isValidTask || task?.closed" @click="handleUpdateTask">
              Save changes
            </FrogButton>
          </FrogPopover>
          <FrogPopover v-else arrowPlacementClass="-without-arrow-top"
            label="Please complete all required information before you can create a task" trigger-on-hover tooltip-alike
            attached :deactivate="!isValidTask">
            <FrogButton :disabled="!isValidTask" @click="handleCreateTask">
              Create Task
            </FrogButton>
          </FrogPopover>
          <FrogButton secondary class="ml-2" @click="emit('close')">
            Cancel
          </FrogButton>
        </div>
      </template>
    </FrogDialog>
  </VuetifyBlurBackground>
</template>
<script setup lang="ts">
import { SelectItem } from '@B-S-F/frog-vue'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import { NamespaceUser } from '~/api'
import useNamespaceUsersStore from '~/store/useNamesapceUsersStore'
import { Task, TaskFormData, UpdateTaskFormData } from '~/types/Task'

type TaskReminderValue = 'overdue' | 'always' | 'disabled'

const props = defineProps<{
  edit?: boolean
  task?: Task
  isReferenceTask?: boolean
}>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'assign-task', uid: string): void
  (e: 'create-task', params: TaskFormData): void
  (e: 'update-task', params: UpdateTaskFormData): void
  (e: 'resolve-task'): void
  (e: 'reopen-task'): void
  (e: 'unassign-task', uid: string[]): void
}>()

/** users */
const namespaceUsersStore = useNamespaceUsersStore()
const { users: namespaceUsers } = storeToRefs(namespaceUsersStore)
const displayUsers = computed(() =>
  namespaceUsers.value.filter((u) =>
    taskFormData.value.assignees.includes(u.id),
  ),
)

/** Display controls */
const enterTitle = computed(() => (!props.isReferenceTask ? true : props.edit))
const enterDescription = computed(() =>
  !props.isReferenceTask ? true : props.edit,
)

const users = ref<SelectItem[]>([])
onMounted(async () => {
  await namespaceUsersStore.fetchUsers()
  let nsUsers = [...namespaceUsers.value]
  // prefill if we're editing the task
  if (props.edit && props.task) {
    taskFormData.value = {
      ...taskFormData.value,
      title: props.task.title || '',
      assignees: props.task.assignees.map((a) => a.id),
      description: props.task.description,
      reminder: props.task.reminder,
      dueDate: new Date(props.task.dueDate).toISOString().split('T')[0],
    }

    nsUsers = nsUsers.filter(
      (u) => !taskFormData.value.assignees.includes(u.id),
    )
  }

  users.value = nsUsers.map((u: NamespaceUser) => ({
    label:
      u.displayName && u.displayName !== ' '
        ? u.displayName
        : (u.username ?? u.id),
    value: u.id,
  }))
})

/** Form state */
const taskFormData = ref<TaskFormData>({
  assignees: [],
  title: '',
  description: '',
  dueDate: '',
  reminder: 'always',
})

/** methods */
const isValidTask = computed(() => {
  const validDate = !isNaN(new Date(taskFormData.value.dueDate).getTime())
  if (props.isReferenceTask) {
    return taskFormData.value.assignees.length > 0 && validDate
  } else {
    return !!(
      taskFormData.value.title &&
      taskFormData.value.title.length > 0 &&
      validDate
    )
  }
})
const handleCreateTask = () => {
  if (!isValidTask.value) return
  emit('create-task', taskFormData.value)
}

const handleResetAssignees = () => {
  const assignees = [...taskFormData.value.assignees]
  taskFormData.value.assignees = []
  users.value = [...namespaceUsers.value].map((u: NamespaceUser) => ({
    label:
      u.displayName && u.displayName !== ' '
        ? u.displayName
        : (u.username ?? u.id),
    value: u.id,
  }))
  if (props.edit) {
    emit('unassign-task', assignees)
  }
}

const onSelectAssignee = (value: string) => {
  const idx = users.value?.findIndex((u) => u.value === (value as string))
  if (idx === -1) return
  taskFormData.value.assignees.push(users.value[idx].value as string)
  // refresh approvers options
  users.value?.splice(idx, 1)
}

const handleRemoveAssignee = (id: string) => {
  const idx = taskFormData.value.assignees.findIndex((u) => u === id)
  if (idx === -1) return
  const userDetails = namespaceUsers.value.find((u) => u.id === id)
  if (userDetails) {
    users.value.push({
      label:
        userDetails.displayName && userDetails.displayName !== ' '
          ? userDetails.displayName
          : (userDetails.username ?? userDetails.id),
      value: userDetails.id,
    })
    taskFormData.value.assignees.splice(idx, 1)
    if (props.edit) emit('unassign-task', [id])
  }
}

const handleUpdateTask = () => {
  const { assignees: _, ...payload } = taskFormData.value
  payload.dueDate = new Date(payload.dueDate).toISOString()
  emit('update-task', payload)
}

const reminderOptions: SelectItem[] = [
  {
    label: 'Disabled',
    value: 'disabled',
  },
  {
    label: 'Overdue',
    value: 'overdue',
  },
  {
    label: 'Always',
    value: 'always',
  },
]
</script>

<style scoped lang="scss">
@use '../../../styles/mixins/flex.scss' as Flex;
@use '../../../styles/tokens.scss' as Tokens;


.right-side-btns {
  display: flex;
}

.create-task-form {
  @include Flex.flexbox($direction: column, $align: stretch);
  row-gap: Tokens.$space-elements;

  section.assignees header {
    @include Flex.flexbox;
    column-gap: Tokens.$space-heading;
  }

  section.assignees .add-assignee {
    margin-bottom: $spacing-16;
  }

  section.assignees ul.assignees-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-gap: $spacing-16;
    max-height: 200px;
    overflow-y: auto;
  }

  section.assignees ul.assignees-list>li {
    background-color: yellow;
    margin: 0;
    padding: 0;

    &::before {
      display: none;
    }
  }

  section.assignees ul.assignees-list {
    &:deep(.m-approver-item) {
      margin-bottom: 0;
    }


  }

  section.general {
    @include Flex.flexbox($direction: column, $align: stretch);
    row-gap: Tokens.$space-component-buttonGroup;
  }
}

.-no-extra-margin {
  margin: 0;
}
</style>
