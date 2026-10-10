'use client'

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      enter: 'Enter the workshop',
      signIn: 'Sign in',
      signOut: 'Sign out',
      email: 'Email',
      password: 'Password',
      tasks: 'Warp board',
      add: 'Add task',
      title: 'Task title',
    },
  },
  es: {
    translation: {
      enter: 'Entrar al taller',
      signIn: 'Entrar',
      signOut: 'Salir',
      email: 'Correo',
      password: 'Contraseña',
      tasks: 'Tablero de urdimbre',
      add: 'Añadir tarea',
      title: 'Título de la tarea',
    },
  },
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })
}

export { i18n }
