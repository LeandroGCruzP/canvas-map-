import React from 'react'
import { io, Socket } from 'socket.io-client'

export function useSocket() {
	const url = 'http://192.168.0.159:3000'
	const [socket, setSocket] = React.useState<Socket>()

	React.useEffect(() => {
		const socket = io(url, { transports: ['websocket'] })

		setSocket(socket)

		function cleanup() {
			socket.disconnect()
		}

		return cleanup
	}, [url])

	return socket
}
