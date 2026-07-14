import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

let socket = null

export const initializeSocket = (userId) => {
  if (socket) {
    socket.disconnect()
  }

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    autoConnect: true
  })

  socket.on('connect', () => {
    socket.emit('user-online', userId)
  })

  socket.on('disconnect', () => {
    console.log('Socket disconnected')
  })

  return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const emitCodeCreated = (data) => {
  if (socket) socket.emit('code-created', data)
}

export const emitCodeUpdated = (data) => {
  if (socket) socket.emit('code-updated', data)
}

export const emitUserFollowed = (data) => {
  if (socket) socket.emit('user-followed', data)
}

export const onNewCode = (callback) => {
  if (socket) socket.on('new-code', callback)
}

export const onFollowerNotification = (callback) => {
  if (socket) socket.on('follower-notification', callback)
}

export const onUserStatus = (callback) => {
  if (socket) socket.on('user-status', callback)
}
