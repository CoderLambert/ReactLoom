import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  resources: {
    en: {
      translation: {
        title: 'A workshop in your pocket.',
        signIn: 'Sign in',
        email: 'Email',
        password: 'Password',
        emailInvalid: 'Enter a valid email address.',
        passwordInvalid: 'Password must be at least 8 characters.',
        tasks: 'Warp board',
        add: 'Add task',
        taskTitle: 'Task title',
        loadingSession: 'Loading session…',
        loadingTasks: 'Loading tasks…',
        taskTitleInvalid: 'Use 3–80 characters for the task title.',
        taskCreateFailed: 'The task could not be added. Your draft is ready to retry.',
        taskLoadFailed: 'Tasks could not be loaded.',
        taskUpdateFailed: 'The task could not be updated. Try again.',
        addingTask: 'Adding task…',
        updatingTask: 'Updating…',
        taskDone: 'Done',
        taskOpen: 'Open',
        noTasks: 'No tasks yet.',
        retry: 'Retry',
        signOut: 'Sign out',
      },
    },
    es: {
      translation: {
        title: 'Un taller en el bolsillo.',
        signIn: 'Entrar',
        email: 'Correo',
        password: 'Contraseña',
        emailInvalid: 'Introduce un correo electrónico válido.',
        passwordInvalid: 'La contraseña debe tener al menos 8 caracteres.',
        tasks: 'Tablero de urdimbre',
        add: 'Añadir tarea',
        taskTitle: 'Título de la tarea',
        loadingSession: 'Cargando sesión…',
        loadingTasks: 'Cargando tareas…',
        taskTitleInvalid: 'El título debe tener entre 3 y 80 caracteres.',
        taskCreateFailed: 'No se pudo añadir la tarea. Puedes volver a intentarlo con tu borrador.',
        taskLoadFailed: 'No se pudieron cargar las tareas.',
        taskUpdateFailed: 'No se pudo actualizar la tarea. Inténtalo de nuevo.',
        addingTask: 'Añadiendo tarea…',
        updatingTask: 'Actualizando…',
        taskDone: 'Hecha',
        taskOpen: 'Abierta',
        noTasks: 'Aún no hay tareas.',
        retry: 'Reintentar',
        signOut: 'Salir',
      },
    },
  },
})

export { i18n }
