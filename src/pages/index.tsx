'use-client'

import { useEffect, useMemo } from 'react'
import { useSocket } from '../hook/useSocket'
import { CreateMapArgs, MouseEventProps, PlayerAPI, Players, Rooms } from '../interfaces/Data'
import styles from '../styles/Home.module.css'

type MouseDownPos = {
  x: number
  y: number
}

type Line = {
  start: {
      x: number
      y: number
  }
  end: {
      x: number
      y: number
  }
}

const PLAYER_COLOR = '#7986CB'
const PLAYER_COLOR_HOVER = '#9FA8DA'
const WHITE_COLOR = '#FFF'
const FONT_COLOR = '#000'

export default function Home() {
  const socket = useSocket()

  const totalMetersCanvas = useMemo(() => {
    const meters = { x: 15.95, y: 8.87 } // TODO: Receive value from server

    return meters
  }, [])
  
  const playersRendered = useMemo(() => {
    const players: Players = {}
    
    return players
  }, [])

  const roomsRendered = useMemo(() => {
    const rooms: Rooms = {}

    return rooms
}, [])

  useEffect(() => {
    if(socket) {
      socket.on('connect', () => console.log('[IO] > I am connected'))

      socket.on('disconnect', () => console.log('[IO] > I am disconnected'))

      socket.emit('setup', {
        width: 1377, // width canvas (px)
        height: 782, // height canvas (px)
        roomHeight: 1595, // height map (centimeter)
        roomWidth: 887 // width map centimeter)
      })

      socket.on('move', (data: PlayerAPI) => {
        function movementListener(movement: any) {
          if(playersRendered) {
            playersRendered[movement.tag] = {
              x: movement.x,
              y: movement.y,
              color: PLAYER_COLOR,
              drawColor: PLAYER_COLOR,
              borderColor: PLAYER_COLOR,
              borderColorSelected: PLAYER_COLOR,
            }
          }
        }

        movementListener({ tag: data.id, x: data.position.x, y: data.position.y })
      })

      socket.on('bounds', data => {
        function newRoomListener(room: any) {
          roomsRendered[room.roomId] = {
            positions: room.positions
          }
        }

        console.log(roomsRendered)

        newRoomListener(data)
      })

      return () => {
        socket.off('connect')
        socket.off('disconnect')
        socket.off('init')
        socket.off('move')
      }
    }
  }, [socket, playersRendered, roomsRendered])

  useEffect(() => {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement
    const context = canvas.getContext('2d') as CanvasRenderingContext2D

    const div = document.getElementById('containerCanvas') as HTMLDivElement
    const buttonPlus = document.getElementById('plus') as HTMLButtonElement
    const buttonMinus = document.getElementById('minus') as HTMLButtonElement
    const spanPositionX = document.getElementById('mousePositionX') as HTMLSpanElement
    const spanPositionY = document.getElementById('mousePositionY') as HTMLSpanElement
    const spanScale = document.getElementById('scale') as HTMLSpanElement

    const h3PlayerId = document.getElementById('playerId') as HTMLSpanElement
    const spanPositionPlayerX = document.getElementById('positionPlayerX') as HTMLSpanElement
    const spanPositionPlayerY = document.getElementById('positionPlayerY') as HTMLSpanElement

    const divActions = document.getElementById('actions') as HTMLDivElement
    const idInput = document.getElementById('idInput') as HTMLInputElement
    const createButton = document.getElementById('createButton') as HTMLButtonElement
    const saveButton = document.getElementById('saveButton') as HTMLButtonElement
    const cancelButton = document.getElementById('cancelButton') as HTMLButtonElement
    let circle = new Path2D()

    divActions.style.display = 'none'

    let totalPixelsCanvas = { x: 0, y: 0 }

    let translatePosition = { x: 0, y: 0 } // * Current canvas position after dragging
    let dragPosition = { x: 0, y: 0 } // * Cursor position when dragging
    let scale = 1
    const scaleMultiplier = 0.8

    const shapeSize = 10

    let mousePosition = { x: 0, y: 0 } // * Mouse position on canvas
    let isMousePressed = false

    let selectPlayerById = ''

    let rooms: { x: number, y: number }[] = []
    let isDrawFinished = false
    let isModeDrawing = false
    let mouseDownPos: MouseDownPos
    let valueInput = ''
    let targetInput: HTMLTextAreaElement

    function createMap({ scale, translate }: CreateMapArgs): void {
      const image = new Image()
      image.src = './aceno.png'

      image.onload = () => {
        canvas.height = div.offsetHeight
        canvas.width = div.offsetWidth

        const { width: widthImage, height: heightImage } = image

        totalPixelsCanvas.x = widthImage
        totalPixelsCanvas.y = heightImage

        context.clearRect(0, 0, widthImage, heightImage)
        context.translate(translate.x, translate.y)
        context.scale(scale, scale)
        context.drawImage(image, 0, 0, widthImage, heightImage)
        context.restore()
      }
    }

    function createPlayer(player: { id: string, x: number, y: number, drawColor: string, borderColorSelected: string }) {
      const heightContainer = 15
      const widthContainer = 50
      const positionContainerX = player.x - widthContainer / 2
      const positionContainerY = player.y + shapeSize + 9
      const text = player.id
      const positionTextX = player.x
      const positionTextY = player.y + shapeSize + 20

      // * Player
      context.beginPath()
      context.arc(player.x, player.y, shapeSize, 0, 2 * Math.PI)
      context.fillStyle = player.drawColor
      context.fill()
      context.strokeStyle = player.borderColorSelected
      context.stroke()
      context.closePath()

      // * Container ID
      context.fillStyle = WHITE_COLOR
      context.fillRect(positionContainerX, positionContainerY, widthContainer, heightContainer)

      // * Text ID
      context.fillStyle = FONT_COLOR
      context.textAlign = 'center'
      context.font = '14px verdana'
      context.fillText(text, positionTextX, positionTextY)
    }

    function createRoom() {
      if(!rooms.length) return

      const lineWidth = 2
      const lineCap = 'round'
      const strokeStyle = WHITE_COLOR
      
      circle.arc(rooms[0].x, rooms[0].y, 10, 0, 2 * Math.PI)
      context.fillStyle = WHITE_COLOR
      context.fill(circle)

      context.beginPath()
      context.setLineDash([0, 0])
      context.moveTo(rooms[0].x, rooms[0].y)
      rooms.map(room => context.lineTo(room.x, room.y))
      context.lineWidth = lineWidth
      context.lineCap = lineCap
      context.strokeStyle = strokeStyle
      context.stroke()
    }

    function drawLine(ctx: CanvasRenderingContext2D, line: Line) {
      const { start, end } = line
      const lineWidth = 2
      const lineCap = 'round'
      const strokeStyle = WHITE_COLOR

      if(!start || !end) return

      ctx.beginPath()
      ctx.setLineDash([10, 10])
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.lineWidth = lineWidth
      ctx.lineCap = lineCap
      ctx.strokeStyle = strokeStyle
      ctx.stroke()
    }

    function renderPlayers(): void {
      createMap({ scale, translate: translatePosition })

      createRoom()
      
      for (const playerId in playersRendered) {
        const player = playersRendered[playerId]

        createPlayer({ id: playerId, x: player.x, y: player.y, drawColor: player.drawColor, borderColorSelected: player.borderColorSelected })

        if (player.color !== player.drawColor) {
          const heightContainer = 55
          const widthContainer = 100
          const paddingContainer = 7
          const positionContainerX = player.x - (widthContainer + paddingContainer) / 2
          const positionContainerY = player.y + shapeSize + 28
          const text = playerId
          const positionTextX = player.x - widthContainer / 2
          const firstPositionTextY = player.y + shapeSize + 42
          const secondPositionTextY = player.y + shapeSize + 58
          const thirdPositionTextY = player.y + shapeSize + 76
          
          const { meterX, meterY } = convertPixelsToMeters({ x: mousePosition.x, y: mousePosition.y })

          // * Container information
          context.fillStyle = WHITE_COLOR
          context.fillRect(positionContainerX, positionContainerY, widthContainer, heightContainer)
          
          // * Text information
          context.fillStyle = FONT_COLOR
          context.textAlign = 'left'
          context.font = '14px verdana'
          context.fillText('ID: ' + text, positionTextX, firstPositionTextY)
          context.fillText('x: ' + meterX, positionTextX, secondPositionTextY)
          context.fillText('y: ' + meterY, positionTextX, thirdPositionTextY)
        }

        const playerSelectedToShowInfo = playersRendered[selectPlayerById]

        if(playerSelectedToShowInfo) {
          playerSelectedToShowInfo.borderColorSelected = WHITE_COLOR

          const convertPixelsToMetersX = playerSelectedToShowInfo.x * totalMetersCanvas.x / totalPixelsCanvas.x
          const convertPixelsToMetersY = playerSelectedToShowInfo.y * totalMetersCanvas.y / totalPixelsCanvas.y

          const [meterX, meterY] = [
            convertPixelsToMetersX.toFixed(2),
            convertPixelsToMetersY.toFixed(2)
          ]

          h3PlayerId.textContent = selectPlayerById
          spanPositionPlayerX.textContent = String(meterX)
          spanPositionPlayerY.textContent = String(meterY)
        }
      }

      for (const roomId in roomsRendered) {
        const room = roomsRendered[roomId]
  
        const lineWidth = 2
        const lineCap = 'round'
        const strokeStyle = PLAYER_COLOR
  
        context.beginPath()
        context.setLineDash([0, 0])
        context.moveTo(room.positions[0].x, room.positions[0].y)
        room.positions.map(position => context.lineTo(position.x, position.y))
        context.lineWidth = lineWidth
        context.lineCap = lineCap
        context.strokeStyle = strokeStyle
        context.stroke()
      }

      requestAnimationFrame(renderPlayers)
    }

    const mouseEvents: MouseEventProps = {
      mouseover() { 
        if (isDrawFinished || !isModeDrawing) {
          canvas.style.cursor = 'inherit'

          return
        }

        canvas.style.cursor = 'crosshair'
      },
      mousedown() {
        const { clientX, clientY } = window.event as MouseEvent
        
        isMousePressed = true

        if (isDrawFinished || !isModeDrawing) {
          canvas.style.cursor = 'move'
        }
        
        dragPosition.x = clientX - translatePosition.x
        dragPosition.y = clientY - translatePosition.y
      },
      mousemove() {
        const { clientX, clientY, offsetX, offsetY } = window.event as MouseEvent

        const { meterX, meterY } = convertPixelsToMeters({ x: mousePosition.x, y: mousePosition.y })

        spanPositionX.textContent = meterX
        spanPositionY.textContent = meterY

        if (isMousePressed) {
          translatePosition.x = clientX - dragPosition.x
          translatePosition.y = clientY - dragPosition.y
        }

        // * View more information on hover player
        if(isDrawFinished || !isModeDrawing) {
          mousePosition.x = offsetX
          mousePosition.y = offsetY
  
          if(canvas.style.cursor === 'pointer') {
            canvas.style.cursor = 'inherit'
          }
  
          for (const playerId in playersRendered) {
            const player = playersRendered[playerId]
  
            createPlayer({ id: playerId, x: player.x, y: player.y, drawColor: player.drawColor, borderColorSelected: player.borderColorSelected })
  
            if (context.isPointInPath(mousePosition.x, mousePosition.y)) {
              canvas.style.cursor = 'pointer'
              player.drawColor = PLAYER_COLOR_HOVER
            } else {
              player.drawColor = player.color
            }
          }
        }

        if (isDrawFinished || rooms.length < 1) return 

        let currentPos = {
          x: (clientX - translatePosition.x) * (totalPixelsCanvas.x / (totalPixelsCanvas.x * scale)),
          y: (clientY - translatePosition.y) * (totalPixelsCanvas.y / (totalPixelsCanvas.y * scale)),
        }

        let line = { start: mouseDownPos, end: currentPos }
        
        drawLine(context, line)
      },
      mouseup() {
        const { clientX, clientY } = window.event as MouseEvent

        isMousePressed = false

        if (isDrawFinished || !isModeDrawing) {
          canvas.style.cursor = 'inherit'
        }

        // * Show more information on sidebar when click on player
        for (const playerId in playersRendered) {
          const player = playersRendered[playerId]

          createPlayer({ id: playerId, x: player.x, y: player.y, drawColor: player.drawColor, borderColorSelected: player.borderColorSelected })

          if (context.isPointInPath(mousePosition.x, mousePosition.y)) {
            selectPlayerById = playerId
          } else {
            player.borderColorSelected = player.borderColor
          }
        }

        if (isDrawFinished || !isModeDrawing) return

        mouseDownPos = {
          x: (clientX - translatePosition.x) * (totalPixelsCanvas.x / (totalPixelsCanvas.x * scale)),
          y: (clientY - translatePosition.y) * (totalPixelsCanvas.y / (totalPixelsCanvas.y * scale)),
        }

        const line = { start: mouseDownPos, end: mouseDownPos }

        drawLine(context, line)

        if (rooms.length > 1 && context.isPointInPath(circle, clientX, clientY)) {
          rooms.push({ x: rooms[0].x, y: rooms[0].y })

          isMousePressed = false
          isDrawFinished = true

          canvas.style.cursor = 'inherit'

          if(valueInput.trim() !== '') {
            saveButton.style.cursor = 'pointer'
            saveButton.disabled = false
          } else {
            saveButton.style.cursor = 'not-allowed'
            saveButton.disabled = true
          }
        } else {
            rooms.push({ x: mouseDownPos.x, y: mouseDownPos.y })
        }
      },
      mouseout() {
        canvas.style.cursor = 'inherit'

        isMousePressed = false
      }
    }

    Object.keys(mouseEvents).forEach(eventName => {
      canvas.addEventListener( eventName, mouseEvents[eventName as keyof MouseEventProps])
    })

    canvas.addEventListener('wheel', event => {
      if(event.deltaY < 0 && scale < 1.95) {
        scale = scale / scaleMultiplier

        let percentScale = Math.round(scale * 100)

        spanScale.textContent = String(percentScale)
      } 
      
      if (event.deltaY > 0 && scale > 0.33) {
        scale = scale * scaleMultiplier

        let percentScale = Math.round(scale * 100)

        spanScale.textContent = String(percentScale)
      }
    })

    buttonPlus.addEventListener('click', () => {
      if (scale < 1.95) { // ? max: 195%
        scale = scale / scaleMultiplier

        let percentScale = Math.round(scale * 100)

        spanScale.textContent = String(percentScale)
      }
    }, false)

    buttonMinus.addEventListener('click', () => {
      if (scale > 0.33) { // ? min: 33%
        scale = scale * scaleMultiplier

        let percentScale = Math.round(scale * 100)

        spanScale.textContent = String(percentScale)
      }
    }, false)

    createButton.addEventListener('click', () => {
      isModeDrawing = true

      divActions.style.display = 'flex'
      idInput.focus()
      createButton.style.cursor = 'not-allowed'
      createButton.disabled = true
      saveButton.style.cursor = 'not-allowed'
      saveButton.disabled = true
    })

    idInput.addEventListener('input', event => {
      targetInput = event.target as HTMLTextAreaElement
      valueInput = targetInput.value

      if(valueInput.trim() !== '' && isDrawFinished) {
        saveButton.style.cursor = 'pointer'
        saveButton.disabled = false
      } else {
        saveButton.style.cursor = 'not-allowed'
        saveButton.disabled = true
      }
    })

    saveButton.addEventListener('click', () => {
      if(valueInput.trim() !== '' && isDrawFinished) {
        socket?.emit('newRoom', {
          roomId: valueInput,
          positions: rooms
        })

        // If true execute
        context.clearRect(0, 0, canvas.width, canvas.height)

        isMousePressed = false
        isDrawFinished = false
        isModeDrawing = false
  
        circle = new Path2D()
        rooms = []
        if (targetInput) {
          targetInput.value = ''
        }
        valueInput = ''
  
        divActions.style.display = 'none'
        createButton.style.cursor = 'pointer'
        createButton.disabled = false
      }
    })

    cancelButton.addEventListener('click', () => {
      context.clearRect(0, 0, canvas.width, canvas.height)

      isMousePressed = false
      isDrawFinished = false
      isModeDrawing = false

      circle = new Path2D()
      rooms = []
      if (targetInput) {
        targetInput.value = ''
      }
      valueInput = ''

      divActions.style.display = 'none'
      createButton.style.cursor = 'pointer'
      createButton.disabled = false
    })

    // * ------------------------------------- Utils ------------------------------------- * //
    function convertPixelsToMeters(position: { x: number, y: number }): {meterX: string, meterY: string} {
      const [mousePositionX, mousePositionY] = [
        (position.x - translatePosition.x) * (totalPixelsCanvas.x / (totalPixelsCanvas.x * scale)),
        (position.y - translatePosition.y) * (totalPixelsCanvas.y / (totalPixelsCanvas.y * scale))
      ]

      const [convertPixelsToMetersX, convertPixelsToMetersY] = [
        mousePositionX * totalMetersCanvas.x / totalPixelsCanvas.x,
        mousePositionY * totalMetersCanvas.y / totalPixelsCanvas.y
      ]

      const [meterX, meterY] = [
        convertPixelsToMetersX.toFixed(2),
        convertPixelsToMetersY.toFixed(2)
      ]

      return { meterX, meterY }
    }

    createMap({ scale, translate: translatePosition })
    createRoom()
    renderPlayers()
  }, [playersRendered, totalMetersCanvas, roomsRendered, socket])

  return (
    <div className={styles.container}>
      <div id='containerCanvas' className={styles.wrapperCanvas}>
        <canvas id='canvas' className={styles.canvas}></canvas>

        <div className={styles.commandWrapper}>
          <div className={styles.percentage}>
            <span id='scale'>100</span><span>%</span>
          </div>
          <div className={styles.positions}>
            <div className={styles.position}>
              <span>x:</span><span id='mousePositionX'></span>
            </div>

            <div className={styles.position}>
              <span>y:</span><span id='mousePositionY'></span>
            </div>
          </div>

          <div className={styles.buttons}>
            <input type='button' id='plus' value='+' />
            <input type='button' id='minus' value='-' />
          </div>
        </div>
      </div>

      <div className={styles.sidebar}>
        <div className={styles.title}>
          <h3>Player:</h3><h3 id='playerId'></h3>
        </div>

        <div className={styles.selections}>
          <div className={styles.selection}>
            <span>x:</span><span id='positionPlayerX'></span>
          </div>
          <div className={styles.selection}>
            <span>y:</span><span id='positionPlayerY'></span>
          </div>
        </div>

        <div className={styles.actions}>
          <button id='createButton' className={styles.button}>Create new room</button>

          <div id='actions' className={styles.actions}>
            <div className={styles.containerInput}>
              <span>Room ID</span>
              
              <input type='text' id='idInput' className={styles.input} />
            </div>

            <div className={styles.containerButtons}>
              <button id='saveButton' className={styles.button}>Save</button>
              <button id='cancelButton' className={styles.buttonCancel}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
