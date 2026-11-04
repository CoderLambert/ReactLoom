import { Redirect } from 'expo-router'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native'
import { useAuth } from '@/features/auth/auth-context'
import type { Session } from '@/features/auth/schema'
import { taskTitleSchema } from '@/features/tasks/schema'
import { useTasks } from '@/features/tasks/use-tasks'

export default function TasksScreen() {
  const auth = useAuth()
  const { t } = useTranslation()
  if (auth.status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>{t('loadingSession')}</Text>
      </View>
    )
  }
  if (auth.status !== 'authenticated' || !auth.session) return <Redirect href="/login" />
  return (
    <AuthenticatedTasksScreen key={auth.revision} session={auth.session} revision={auth.revision} />
  )
}

function AuthenticatedTasksScreen({ session, revision }: { session: Session; revision: number }) {
  const { t } = useTranslation()
  const auth = useAuth()
  const { query, createTask, updateTask } = useTasks({
    session,
    revision,
    invalidateSession: auth.invalidateSession,
  })
  const [title, setTitle] = useState('')
  const [invalidTitle, setInvalidTitle] = useState(false)
  const draftVersion = useRef(0)
  const submitting = useRef(false)

  async function submit() {
    if (submitting.current) return
    const parsed = taskTitleSchema.safeParse(title)
    setInvalidTitle(!parsed.success)
    if (!parsed.success) return
    const submittedVersion = draftVersion.current
    submitting.current = true
    try {
      await createTask.mutateAsync(parsed.data)
      if (draftVersion.current === submittedVersion) setTitle('')
    } catch {
      // The mutation error stays visible beside the retained draft.
    } finally {
      submitting.current = false
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f4f0e6', padding: 24, gap: 16 }}>
      <Text accessibilityRole="header" style={{ fontSize: 40, color: '#1c1915' }}>
        {t('tasks')}
      </Text>
      <TextInput
        accessibilityLabel={t('taskTitle')}
        value={title}
        onChangeText={(next) => {
          draftVersion.current += 1
          setTitle(next)
          setInvalidTitle(false)
          if (!createTask.isPending) createTask.reset()
        }}
        onSubmitEditing={() => {
          void submit()
        }}
        placeholder={t('taskTitle')}
        style={{
          backgroundColor: '#fffdf8',
          borderRadius: 16,
          padding: 12,
          borderWidth: 1,
          borderColor: '#e3dac8',
        }}
      />
      {invalidTitle && <Text accessibilityRole="alert">{t('taskTitleInvalid')}</Text>}
      {createTask.isError && <Text accessibilityRole="alert">{t('taskCreateFailed')}</Text>}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: createTask.isPending, busy: createTask.isPending }}
        disabled={createTask.isPending}
        onPress={() => {
          void submit()
        }}
        style={{
          backgroundColor: '#1c1915',
          borderRadius: 999,
          paddingVertical: 12,
          alignItems: 'center',
          opacity: createTask.isPending ? 0.6 : 1,
        }}
      >
        <Text style={{ color: '#f4f0e6' }}>{t(createTask.isPending ? 'addingTask' : 'add')}</Text>
      </Pressable>
      {query.isPending && (
        <View>
          <ActivityIndicator accessibilityLabel={t('loadingTasks')} />
          <Text>{t('loadingTasks')}</Text>
        </View>
      )}
      {query.isError && (
        <View style={{ gap: 8 }}>
          <Text accessibilityRole="alert">{t('taskLoadFailed')}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void query.refetch()
            }}
          >
            <Text>{t('retry')}</Text>
          </Pressable>
        </View>
      )}
      {updateTask.isError && <Text accessibilityRole="alert">{t('taskUpdateFailed')}</Text>}
      {!query.isPending && !query.isError && query.data?.length === 0 && (
        <Text>{t('noTasks')}</Text>
      )}
      <FlatList
        data={query.data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const pending = updateTask.isPending && updateTask.variables.id === item.id
          return (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityLabel={item.title}
              accessibilityState={{
                checked: item.status === 'done',
                disabled: updateTask.isPending,
                busy: pending,
              }}
              disabled={updateTask.isPending}
              onPress={() =>
                updateTask.mutate({
                  id: item.id,
                  status: item.status === 'done' ? 'open' : 'done',
                })
              }
              style={{ paddingVertical: 10, gap: 4 }}
            >
              <Text style={{ color: item.status === 'done' ? '#5e564c' : '#1c1915' }}>
                {item.title}
              </Text>
              <Text>
                {t(pending ? 'updatingTask' : item.status === 'done' ? 'taskDone' : 'taskOpen')}
              </Text>
            </Pressable>
          )
        }}
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          // Storage failures are exposed by the provider on the login screen.
          void auth.signOut().catch(() => undefined)
        }}
      >
        <Text>{t('signOut')}</Text>
      </Pressable>
    </View>
  )
}
