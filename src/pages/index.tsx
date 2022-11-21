'use-client'

import { useEffect, useState } from 'react'
import { useSocket } from '../hook/useSocket'
import styles from '../styles/Home.module.css'

type Players = {
  [playerId: string]: {
    x: number
    y: number
  }
}

type PlayerCommand = {
  playerId: string
  playerX: number
  playerY: number
}

type CommandToMovePlayer = {
  keyPressed: string
  playerId: string
}

type MouseEventProps = {
  mousedown(): void
  mouseup(): void
  mouseover(): void
  mouseout(): void
  mousemove(): void
}

type CreateMapArgs = {
  scale: number
  translateCanvasPosition: {
    x: number
    y: number
  }
}

type Position = {
  x: number
  y: number
}

export default function Home() {
  const [mousePositionX, setMousePositionX] = useState('')
  const [mousePositionY, setMousePositionY] = useState('')
  const [percentScale, setPercentScale] = useState(100)

  const socket = useSocket()

  useEffect(() => {
    if(socket) {
      socket.on('connect', () => console.log('[IO] > I am connected'))

      socket.on('disconnect', () => console.log('[IO] > I am disconnected'))

      socket.emit('init', {
        width: 1377, // width canvas (px)
        height: 782, // height canvas (px)
        roomHeight: 1595, // height map (centimeter)
        roomWidth: 887 // width map centimeter)
      })

      socket.on('move', ({ x, y }) => {
        // console.log(x, y)
      })

      return () => {
        socket.off('connect')
        socket.off('disconnect')
        socket.off('init')
        socket.off('move')
      }
    }
  }, [socket])

  useEffect(() => {
    const div = document.getElementById('containerCanvas') as HTMLDivElement
    const canvas = document.getElementById('canvas') as HTMLCanvasElement
    const context = canvas.getContext('2d') as CanvasRenderingContext2D
    const buttonPlus = document.getElementById('plus') as HTMLButtonElement
    const buttonMinus = document.getElementById('minus') as HTMLButtonElement

    const canvasSize = { height: 0, width: 0 }
    const translateCanvasPosition = { x: 0, y: 0 }
    const dragOffset = { x: 0, y: 0 }
    const players: Players = {}

    let [widthFactor, heightFactor] = [0, 0]
    let scale = 1
    const scaleMultiplier = 0.8
    const [totalMetersOfCanvasX, totalMetersOfCanvasY] = [15.95, 8.87]
    let [totalPixelsOfCanvasX, totalPixelsOfCanvasY] = [0, 0]
    let mouseDown = false
    let [playerX, playerY] = [775, 415]

    // * --------------------------- Fn: Creating map --------------------------- * //
    function createMap({ scale, translateCanvasPosition }: CreateMapArgs): void {
      const image = new Image()
      image.src = './aceno.png'

      image.onload = () => {
        const { width: widthImage, height: heightImage } = image
        const [relativeWidthOfImageByScale, relativeHeightOfImageByScale] = [
          Math.round(widthImage * scale),
          Math.round(heightImage * scale),
        ]
        widthFactor = widthImage / relativeWidthOfImageByScale
        heightFactor = heightImage / relativeHeightOfImageByScale

        totalPixelsOfCanvasX = widthImage
        totalPixelsOfCanvasY = heightImage

        canvas.height = div.offsetHeight
        canvas.width = div.offsetWidth

        context.clearRect(0, 0, widthImage, heightImage)

        context.translate(translateCanvasPosition.x, translateCanvasPosition.y)
        context.scale(scale, scale)
        context.drawImage(image, 0, 0, widthImage, heightImage)
        context.restore()
      }
    }

    // * --------------------------- Fn: Adding player --------------------------- * //
    function addPlayer(command: PlayerCommand): void {
      const { playerId, playerX, playerY } = command

      players[playerId] = {
        x: playerX,
        y: playerY,
      }
    }

    // * --------------------------- Fn: Moving player --------------------------- * //
    function movePlayer(command: CommandToMovePlayer): void {
      const acceptedMoves = {
        ArrowUp(playerPosition: Position) {
          if(playerPosition.y - 1 >= 0) {
            playerPosition.y = playerPosition.y - 1
          }
        },
        ArrowRight(playerPosition: Position) {
          if(playerPosition.x + 1 < canvas.width) {
            playerPosition.x = playerPosition.x + 1
          }
        },
        ArrowDown(playerPosition: Position) {
          if(playerPosition.y + 1 < canvas.height) {
            playerPosition.y = playerPosition.y + 1
          }
        },
        ArrowLeft(playerPosition: Position) {
          if(playerPosition.x - 1 >= 0) {
            playerPosition.x = playerPosition.x - 1
          }
        }
      }

      
      const keyPressed = command.keyPressed
      const playerId = command.playerId
      const playerPosition = players[playerId]
      const moveFunction = acceptedMoves[keyPressed]

      if(playerPosition && moveFunction) {
        moveFunction(playerPosition)
      }
    }

    // * ------------------------- Fn: Keyboard Listener ------------------------- * //
    function createKeyboardListener() {
      document.addEventListener('keydown', handleKeyDown)

      const state: { observers: any } = { observers: [] }

      function handleKeyDown(event: KeyboardEvent): void {
        const keyPressed = event.key
  
        const playerCommand: CommandToMovePlayer = {
          playerId: 'Leh',
          keyPressed
        }
  
        notifyAll(playerCommand)
      }

      function subscribe(observerFn: (playerCommand: CommandToMovePlayer) => void): void {
        state.observers.push(observerFn)
      }

      function notifyAll(playerCommand: CommandToMovePlayer): void {
        for(const observerFunction of state.observers) {
          observerFunction(playerCommand)
        }
      }

      return {
        subscribe
      }
    }

    // * -------------------------- Fn: Render Players -------------------------- * //
    function renderPlayers(): void {
      // * Render map
      createMap({ scale, translateCanvasPosition })
      
      for (const playerId in players) {
        const player = players[playerId]
        const sizePlayer = 10

        // * Creating player
        var circle = new Path2D()
        circle.moveTo(125, 35)
        circle.arc(player.x, player.y, sizePlayer, 0, 2 * Math.PI)
        context.fill(circle)
        context.fillStyle = 'white'

        // * Text below player
        context.font = '15px Roboto'
        context.textAlign = 'center'
        context.fillText(playerId, player.x, player.y + sizePlayer * 3)
      }

      requestAnimationFrame(renderPlayers)
    }

    // * ------------ Event listener (buttons): zoom in and zoom out ------------ * //
    buttonPlus.addEventListener('click', () => {
      if (scale < 1.95) { // * max: 195%
        scale = scale / scaleMultiplier

        const totalPercentScale = scale * 100

        setPercentScale(Math.round(totalPercentScale))

        createMap({ scale, translateCanvasPosition })
      }
    }, false)

    buttonMinus.addEventListener('click', () => {
      if (scale > 0.33) { // * min: 33%
        scale = scale * scaleMultiplier

        const totalPercentScale = scale * 100

        setPercentScale(Math.round(totalPercentScale))

        createMap({ scale, translateCanvasPosition })
      }
    }, false)

    // * ------------- Event listener (mouse): dragging and moving ------------- * //
    const mouseEvents: MouseEventProps = {
      mousedown() {
        const { clientX, clientY } = window.event as MouseEvent

        mouseDown = true
        
        if (mouseDown) {
          canvas.style.cursor = 'move'
        }

        dragOffset.x = clientX - translateCanvasPosition.x
        dragOffset.y = clientY - translateCanvasPosition.y
      },
      mousemove() {
        const { clientX, clientY, offsetX, offsetY } = window.event as MouseEvent

        const mousePositionY = Math.round(
          (offsetY - translateCanvasPosition.y) * heightFactor
        )
        const mousePositionX = Math.round(
          (offsetX - translateCanvasPosition.x) * widthFactor
        )

        const [convertPixelsToMetersX, convertPixelsToMetersY] = [
          (mousePositionX * totalMetersOfCanvasX) / totalPixelsOfCanvasX,
          (mousePositionY * totalMetersOfCanvasY) / totalPixelsOfCanvasY
        ]

        setMousePositionX(convertPixelsToMetersX.toFixed(2))
        setMousePositionY(convertPixelsToMetersY.toFixed(2))

        if (mouseDown) {
          translateCanvasPosition.x = clientX - dragOffset.x
          translateCanvasPosition.y = clientY - dragOffset.y
          createMap({ scale, translateCanvasPosition })
        }
      },
      mouseup() {
        canvas.style.cursor = 'inherit'

        mouseDown = false
      },
      mouseover() {
        mouseDown = false
      },
      mouseout() {
        canvas.style.cursor = 'inherit'

        mouseDown = false
      },
    }

    Object.keys(mouseEvents).forEach((eventName) => {
      canvas.addEventListener( eventName, mouseEvents[eventName as keyof MouseEventProps])
    })

    // * ---------------------------- Resize canvas ---------------------------- * //
    function containerSize() {
      canvasSize.height = div.offsetHeight
      canvasSize.width = div.offsetWidth

      createMap({ scale, translateCanvasPosition })
    }

    new ResizeObserver(containerSize).observe(div)

    // * ------------------- Render map, players and others ------------------- * //
    createMap({ scale, translateCanvasPosition })
    const keyboardListener = createKeyboardListener()
    keyboardListener.subscribe(movePlayer)
    addPlayer({ playerId: 'Leh', playerX: playerX, playerY: playerY })
    renderPlayers()
  }, [])

  return (
    <div className={styles.container}>
      <div id='containerCanvas' className={styles.wrapperCanvas}>
        <canvas id='canvas' className={styles.canvas}></canvas>

        <div className={styles.commandWrapper}>
          <div className={styles.percentage}>
            <span>{percentScale}%</span>
          </div>
          <div className={styles.position}>
            <span>x: {mousePositionX}</span>
            <span>y: {mousePositionY}</span>
          </div>

          <div className={styles.buttons}>
            <input type='button' id='plus' value='+' />
            <input type='button' id='minus' value='-' />
          </div>
        </div>
      </div>

      <div className={styles.sidebar}>
        <h3>Actions</h3>

        <div>
          <div className={styles.selection}>
            <input type='checkbox' name='selection1' id='selection1' />
            <span>x: 15,95 ~ 1377</span>
          </div>
          <div className={styles.selection}>
            <input type='checkbox' name='selection2' id='selection2' />
            <span>y: 8,87 ~ 782</span>
          </div>
        </div>
      </div>
    </div>
  )
}
