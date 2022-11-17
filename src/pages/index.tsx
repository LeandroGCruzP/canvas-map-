'use-client'

import { useEffect, useState } from 'react'
import styles from '../styles/Home.module.css'

type Players = {
  [playerId: string]: {
    x: number
    y: number
  }
}

interface PlayerCommand {
  playerId: string
  playerX: number
  playerY: number
}

interface MouseEventProps {
  mousedown(): void
  mouseup(): void
  mouseover(): void
  mouseout(): void
  mousemove(): void
}

export default function Home() {
  const [mousePositionX, setMousePositionX] = useState(0)
  const [mousePositionY, setMousePositionY] = useState(0)
  const [percentScale, setPercentScale] = useState(100)

  useEffect(() => {
    const container = document.getElementById('containerCanvas') as HTMLDivElement
    const canvas = document.getElementById('canvas') as HTMLCanvasElement
    const context = canvas.getContext('2d') as CanvasRenderingContext2D
    const buttonPlus = document.getElementById('plus') as HTMLButtonElement
    const buttonMinus = document.getElementById('minus') as HTMLButtonElement

    canvas.style.backgroundColor = 'gray'

    const resizeCanvas = { height: 0, width: 0 }
    const translatePosition = { x: 0, y: 0 }
    let startDragOffset = { x: 0, y: 0 }
    const players: Players = {}
    let widthFactor = 0
    let heightFactor = 0
    let scale = 1
    const scaleMultiplier = 0.8
    let mouseDown = false

    function createMap(scale: number, translatePosition: { x: number, y: number }) {      
      const mapImg = new Image()
      mapImg.src = './aceno.png'
      
      mapImg.onload = () => {
        const { width, height } = mapImg // 1420 x 831
        const relativeImageWidth = Math.round(width * scale)
        const relativeImageHeight = Math.round(height * scale)
        widthFactor = width / relativeImageWidth
        heightFactor = height / relativeImageHeight

        const containerHeight = container.offsetHeight
        const containerWidth = container.offsetWidth

        canvas.height = containerHeight
        canvas.width = containerWidth
        
        context.clearRect(0, 0, width, height)
        
        context.translate(translatePosition.x, translatePosition.y)
        context.scale(scale, scale)
        context.drawImage(mapImg, 0, 0, width, height)
        context.restore()
      }
    }

    function addPlayer(command: PlayerCommand): void {
      const playerId = command.playerId
      const playerX = command.playerX
      const playerY = command.playerY

      players[playerId] = {
        x: playerX,
        y: playerY,
      }
    }

    function renderPlayers() {
      for (const playerId in players) {
        const player = players[playerId]
        
        var circle = new Path2D()
        circle.moveTo(125, 35)
        circle.arc(player.x, player.y, 10, 0, 2 * Math.PI)
        context.fill(circle)
        context.fillStyle = '#FFF'
      }

      requestAnimationFrame(renderPlayers)
    }
    
    // Button event listener: zoom in and zoom out
    buttonPlus.addEventListener('click', () => {
      if(scale < 1.95) { // 195%
        scale = scale / scaleMultiplier
  
        const totalPercentScale = scale * 100

        setPercentScale(Math.round(totalPercentScale))

        createMap(scale, translatePosition)
      }
    }, false)

    buttonMinus.addEventListener('click', () => {
      if(scale > 0.33) { // 33%
        scale = scale * scaleMultiplier

        const totalPercentScale = scale * 100

        setPercentScale(Math.round(totalPercentScale))

        createMap(scale, translatePosition)
      }
    }, false)

    // Mouse event listener: dragging
    const mouseEvents: MouseEventProps = {
      mousedown(){
        const { clientX, clientY } = window.event as MouseEvent

        mouseDown = true
        if(mouseDown) {
          canvas.style.cursor = 'move'
        }

        startDragOffset.x = clientX - translatePosition.x
        startDragOffset.y = clientY - translatePosition.y
      },
      mousemove(){
        const { clientX, clientY, offsetX, offsetY } = window.event as MouseEvent

        const mousePositionY = Math.round((offsetY - translatePosition.y) * heightFactor)
        const mousePositionX = Math.round((offsetX - translatePosition.x) * widthFactor)

        setMousePositionX(mousePositionX)
        setMousePositionY(mousePositionY)

        if(mouseDown) {
          translatePosition.x = clientX - startDragOffset.x
          translatePosition.y = clientY - startDragOffset.y
          createMap(scale, translatePosition)
        }
      },
      mouseup(){ 
        canvas.style.cursor = 'inherit'

        mouseDown = false 
      },
      mouseover(){ 
        mouseDown = false
      },
      mouseout(){ 
        canvas.style.cursor = 'inherit'

        mouseDown = false
      }
    }

    Object.keys(mouseEvents).forEach((eventName) => {
      canvas.addEventListener(eventName, mouseEvents[eventName as keyof MouseEventProps])
    })

    // Resize canvas
    function containerSize() {
      resizeCanvas.height = container.offsetHeight
      resizeCanvas.width = container.offsetWidth

      createMap(scale, translatePosition)
    }

    new ResizeObserver(containerSize).observe(container)

    createMap(scale, translatePosition)
    addPlayer({ playerId: 'player1', playerX: 800, playerY: 430 })
    addPlayer({ playerId: 'player2', playerX: 625, playerY: 80 })
    addPlayer({ playerId: 'player3', playerX: 270, playerY: 80 })
    renderPlayers()
  }, [])

  return (
    <div className={styles.container}>
      <div id='containerCanvas' className={styles.wrapperCanvas}>
        <canvas id='canvas' className={styles.canvas}></canvas>

        <div className={styles.commandWrapper}>
          <div className={styles.position}>
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
            <span>Selection 1</span>
          </div>
          <div className={styles.selection}>
            <input type='checkbox' name='selection2' id='selection2' />
            <span>Selection 2</span>
          </div>
          <div className={styles.selection}>
            <input type='checkbox' name='selection3' id='selection3' />
            <span>Selection 3</span>
          </div>
        </div>

        <h3>More actions</h3>

        <div>
          <div className={styles.selection}>
            <input type='checkbox' name='selection4' id='selection4' />
            <span>Selection 4</span>
          </div>
          <div className={styles.selection}>
            <input type='checkbox' name='selection5' id='selection5' />
            <span>Selection 5</span>
          </div>
          <div className={styles.selection}>
            <input type='checkbox' name='selection6' id='selection6' />
            <span>Selection 6</span>
          </div>
          <div className={styles.selection}>
            <input type='checkbox' name='selection7' id='selection7' />
            <span>Selection 7</span>
          </div>
          <div className={styles.selection}>
            <input type='checkbox' name='selection8' id='selection8' />
            <span>Selection 8</span>
          </div>
        </div>
      </div>
    </div>
  )
}
