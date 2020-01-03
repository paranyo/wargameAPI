const SocketIO = require('socket.io')

module.exports = (server, app) => {
	const io = SocketIO(server, { path: '/socket.io' })
	
	app.set('io', io)

	io.on('connection', (socket) => {
		socket.join('/auction')
		socket.on('disconnect', () => {
			socket.leave('/auction')
		})
	})
}
