'use-client'

import { useEffect, useMemo } from 'react'
import { useSocket } from '../hook/useSocket'
import { CreateMapArgs, MouseEventProps, PlayerAPI, Players } from '../interfaces/Data'
import styles from '../styles/Home.module.css'

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
    const players: Players = { 
      // 'Tiago': { x: 615, y: 45, color: PLAYER_COLOR, drawColor: PLAYER_COLOR, borderColor: PLAYER_COLOR, borderColorSelected: PLAYER_COLOR },
      // 'Chile': { x: 787, y: 400, color: PLAYER_COLOR, drawColor: PLAYER_COLOR, borderColor: PLAYER_COLOR, borderColorSelected: PLAYER_COLOR },
    }
    
    return players
  }, [])

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

      return () => {
        socket.off('connect')
        socket.off('disconnect')
        socket.off('init')
        socket.off('move')
      }
    }
  }, [socket, playersRendered])

  useEffect(() => {
    const div = document.getElementById('containerCanvas') as HTMLDivElement
    const canvas = document.getElementById('canvas') as HTMLCanvasElement
    const context = canvas.getContext('2d') as CanvasRenderingContext2D
    const buttonPlus = document.getElementById('plus') as HTMLButtonElement
    const buttonMinus = document.getElementById('minus') as HTMLButtonElement
    const spanPositionX = document.getElementById('mousePositionX') as HTMLSpanElement
    const spanPositionY = document.getElementById('mousePositionY') as HTMLSpanElement
    const spanScale = document.getElementById('scale') as HTMLSpanElement
    const h3PlayerId = document.getElementById('playerId') as HTMLSpanElement
    const spanPositionPlayerX = document.getElementById('positionPlayerX') as HTMLSpanElement
    const spanPositionPlayerY = document.getElementById('positionPlayerY') as HTMLSpanElement

    let totalPixelsCanvas = { x: 0, y: 0 }

    let translatePosition = { x: 0, y: 0 } // * Current canvas position after dragging
    let dragPosition = { x: 0, y: 0 } // * Cursor position when dragging
    let scale = 1
    const scaleMultiplier = 0.8

    const shapeSize = 10

    let mousePosition = { x: 0, y: 0 } // * Mouse position on canvas
    let mouseDown = false

    let cut_id = ''

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

    function renderPlayers(): void {
      createMap({ scale, translate: translatePosition })
      
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

        const playerSelectedToShowInfo = playersRendered[cut_id]

        if(playerSelectedToShowInfo) {
          playerSelectedToShowInfo.borderColorSelected = WHITE_COLOR

          const convertPixelsToMetersX = playerSelectedToShowInfo.x * totalMetersCanvas.x / totalPixelsCanvas.x
          const convertPixelsToMetersY = playerSelectedToShowInfo.y * totalMetersCanvas.y / totalPixelsCanvas.y

          const [meterX, meterY] = [
            convertPixelsToMetersX.toFixed(2),
            convertPixelsToMetersY.toFixed(2)
          ]

          h3PlayerId.textContent = cut_id
          spanPositionPlayerX.textContent = String(meterX)
          spanPositionPlayerY.textContent = String(meterY)
        }
      }

      requestAnimationFrame(renderPlayers)
    }

    // * Event listener (buttons - scroll): zoom in and zoom out 
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

    // * Event listener (mouse): dragging - moving - show info 
    const mouseEvents: MouseEventProps = {      
      mousedown() {
        const { clientX, clientY } = window.event as MouseEvent

        mouseDown = true
        
        canvas.style.cursor = 'move'

        dragPosition.x = clientX - translatePosition.x
        dragPosition.y = clientY - translatePosition.y
      },
      mousemove() {
        const { clientX, clientY, offsetX, offsetY } = window.event as MouseEvent

        const { meterX, meterY } = convertPixelsToMeters({ x: mousePosition.x, y: mousePosition.y })

        spanPositionX.textContent = meterX
        spanPositionY.textContent = meterY

        if (mouseDown) {
          translatePosition.x = clientX - dragPosition.x
          translatePosition.y = clientY - dragPosition.y
        }

        // * View more information on hover player
        mousePosition.x = offsetX
        mousePosition.y = offsetY

        canvas.style.cursor = 'inherit'

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
      },
      mouseup() {
        canvas.style.cursor = 'inherit'

        mouseDown = false

        // * Show more information on sidebar when click on player
        for (const playerId in playersRendered) {
          const player = playersRendered[playerId]

          createPlayer({ id: playerId, x: player.x, y: player.y, drawColor: player.drawColor, borderColorSelected: player.borderColorSelected })

          if (context.isPointInPath(mousePosition.x, mousePosition.y)) {
            cut_id = playerId
          } else {
            player.borderColorSelected = player.borderColor
          }
        }
      },
      mouseover() { 
        mouseDown = false
      },
      mouseout() {
        canvas.style.cursor = 'inherit'

        mouseDown = false
      }
    }

    Object.keys(mouseEvents).forEach(eventName => {
      canvas.addEventListener( eventName, mouseEvents[eventName as keyof MouseEventProps])
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
    renderPlayers()
  }, [playersRendered, totalMetersCanvas])

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
        <div className={styles.selection}>
          <h3>Player:</h3><h3 id='playerId'></h3>
        </div>

        <div>
          <div className={styles.selection}>
            <span>x:</span><span id='positionPlayerX'></span>
          </div>
          <div className={styles.selection}>
            <span>y:</span><span id='positionPlayerY'></span>
          </div>
        </div>
      </div>
    </div>
  )
}
