import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, Pressable, Text, TextInput, View } from 'react-native'
import { useAuth } from '@/features/auth/auth-context'
import { createTaskRepository, type Task } from '@/features/tasks/repository'

const repository = createTaskRepository([
  { id: 'task-1', title: 'Dress the loom', status: 'open' },
  { id: 'task-2', title: 'Wind a bobbin', status: 'done' },
])

export default function TasksScreen() {
  const { t } = useTranslation()
  const auth = useAuth()
  const [title, setTitle] = useState('')
  const [tasks, setTasks] = useState<Task[]>(repository.list())

  return (
    <View style={{ flex: 1, backgroundColor: '#f4f0e6', padding: 24, gap: 16 }}>
      <Text accessibilityRole="header" style={{ fontSize: 40, color: '#1c1915' }}>
        {t('tasks')}
      </Text>
      <TextInput
        accessibilityLabel={t('taskTitle')}
        value={title}
        onChangeText={setTitle}
        placeholder={t('taskTitle')}
        style={{
          backgroundColor: '#fffdf8',
          borderRadius: 16,
          padding: 12,
          borderWidth: 1,
          borderColor: '#e3dac8',
        }}
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          const next = title.trim()
          if (next.length < 3) return
          repository.create(next)
          setTasks(repository.list())
          setTitle('')
        }}
        style={{
          backgroundColor: '#1c1915',
          borderRadius: 999,
          paddingVertical: 12,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#f4f0e6' }}>{t('add')}</Text>
      </Pressable>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text
            style={{ paddingVertical: 10, color: item.status === 'done' ? '#5e564c' : '#1c1915' }}
          >
            {item.title}
          </Text>
        )}
      />
      <Pressable accessibilityRole="button" onPress={() => void auth.signOut()}>
        <Text>Sign out</Text>
      </Pressable>
    </View>
  )
}
