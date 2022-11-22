'use-client'

import { useEffect } from 'react'
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
  const socket = useSocket()

  const players: Players = {}

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
        function movementListener(movement: any) {
          if(players) {
            players[movement.playerId] = {
              x: movement.x,
              y: movement.y
            }
          }
        }

        movementListener({ playerId: 'Leh', x, y })
      })

      return () => {
        socket.off('connect')
        socket.off('disconnect')
        socket.off('init')
        socket.off('move')
      }
    }
  }, [socket, players])

  useEffect(() => {
    const div = document.getElementById('containerCanvas') as HTMLDivElement
    const canvas = document.getElementById('canvas') as HTMLCanvasElement
    const context = canvas.getContext('2d') as CanvasRenderingContext2D
    const buttonPlus = document.getElementById('plus') as HTMLButtonElement
    const buttonMinus = document.getElementById('minus') as HTMLButtonElement
    const spanPositionX = document.getElementById('mousePositionX') as HTMLSpanElement
    const spanPositionY = document.getElementById('mousePositionY') as HTMLSpanElement
    const spanScale = document.getElementById('scale') as HTMLSpanElement

    let [widthFactor, heightFactor] = [0, 0]
    let [totalPixelsOfCanvasX, totalPixelsOfCanvasY] = [0, 0]
    const canvasSize = { height: 0, width: 0 }
    const translateCanvasPosition = { x: 0, y: 0 }
    const dragOffset = { x: 0, y: 0 }
    const scaleMultiplier = 0.8
    const [totalMetersOfCanvasX, totalMetersOfCanvasY] = [15.95, 8.87]

    let scale = 1
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

        let percentScale = Math.round(totalPercentScale)

        spanScale.textContent = String(percentScale)

        createMap({ scale, translateCanvasPosition })
      }
    }, false)

    buttonMinus.addEventListener('click', () => {
      if (scale > 0.33) { // * min: 33%
        scale = scale * scaleMultiplier

        const totalPercentScale = scale * 100

        let percentScale = Math.round(totalPercentScale)

        spanScale.textContent = String(percentScale)

        createMap({ scale, translateCanvasPosition })
      }
    }, false)

    // * ------------- Event listener (mouse): dragging and moving ------------- * //
    const mouseEvents: MouseEventProps = {
      mousedown() {
        const { clientX, clientY } = window.event as MouseEvent

        mouseDown = true
        
        canvas.style.cursor = 'move'

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

        let resultMousePositionOnMetersX = convertPixelsToMetersX.toFixed(2)
        let resultMousePositionOnMetersY = convertPixelsToMetersY.toFixed(2)

        spanPositionX.textContent = resultMousePositionOnMetersX
        spanPositionY.textContent = resultMousePositionOnMetersY

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
    addPlayer({ playerId: 'Ale', playerX: playerX, playerY: playerY })
    renderPlayers()
  }, [players])

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
