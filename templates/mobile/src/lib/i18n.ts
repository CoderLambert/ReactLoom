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
        tasks: 'Warp board',
        add: 'Add task',
        taskTitle: 'Task title',
      },
    },
    es: {
      translation: {
        title: 'Un taller en el bolsillo.',
        signIn: 'Entrar',
        email: 'Correo',
        password: 'Contraseña',
        tasks: 'Tablero de urdimbre',
        add: 'Añadir tarea',
        taskTitle: 'Título de la tarea',
      },
    },
  },
})

export { i18n }
