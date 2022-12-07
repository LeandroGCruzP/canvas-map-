import { useEffect, useMemo } from 'react'
import styles from '../styles/Home.module.css'

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

type MouseDownPos = {
  x: number
  y: number
}

type Events = {
  mouseover(): void
  mousedown(): void
  mousemove(): void
}

type Rooms = {
  [roomId: string]: {
    positions: { 
        x: number, 
        y: number 
    }[]
  }
}

export default function Draw() {
    const roomsRendered = useMemo(() => {
        const rooms: Rooms = {}

        return rooms
    }, [])

    useEffect(() => {
        const canvas = document.getElementById('canvas') as HTMLCanvasElement
        const idInput = document.getElementById('idInput') as HTMLInputElement
        const createButton = document.getElementById('createButton') as HTMLButtonElement
        const saveButton = document.getElementById('saveButton') as HTMLButtonElement
        const cancelButton = document.getElementById('cancelButton') as HTMLButtonElement
        const context = canvas.getContext('2d') as CanvasRenderingContext2D
        let circle = new Path2D()

        canvas.style.backgroundColor = '#141414'
        idInput.style.display = 'none'
        createButton.style.cursor = 'pointer'
        saveButton.style.display = 'none'
        cancelButton.style.display = 'none'

        let rooms: { x: number, y: number }[] = []

        let isPressed = false
        let isDrawFinished = false
        let isModeDrawing = false
        let mouseDownPos: MouseDownPos
        let valueInput = ''
        let targetInput: HTMLTextAreaElement

        function createRoom() {
            if(!rooms.length) return

            const lineWidth = 2
            const lineCap = 'round'
            const strokeStyle = '#FFF'
            
            circle.arc(rooms[0].x, rooms[0].y, 10, 0, 2 * Math.PI)
            context.fillStyle = '#FF0'
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
            const strokeStyle = '#FFF'

            if(!start || !end) { throw new Error('Start or end of line not defined.') }

            ctx.beginPath()
            ctx.setLineDash([10, 10])
            ctx.moveTo(start.x, start.y)
            ctx.lineTo(end.x, end.y)
            ctx.lineWidth = lineWidth
            ctx.lineCap = lineCap
            ctx.strokeStyle = strokeStyle
            ctx.stroke()
        }

        const mouseEvents: Events = {
            mouseover(){
                if (isDrawFinished || !isModeDrawing) {
                    canvas.style.cursor = 'inherit'

                    return
                }

                canvas.style.cursor = 'crosshair'
            },
            mousedown(){
                const { clientX, clientY } = window.event as MouseEvent

                if (isDrawFinished || !isModeDrawing) return

                isPressed = true
                
                mouseDownPos = {
                    x: clientX - canvas.offsetLeft,
                    y: clientY - canvas.offsetTop
                }
                
                const line = { start: mouseDownPos, end: mouseDownPos }
                
                context.clearRect(0, 0, canvas.width, canvas.height)

                drawLine(context, line)

                if (rooms.length > 1 && context.isPointInPath(circle, mouseDownPos.x, mouseDownPos.y)) {
                    rooms.push({ x: rooms[0].x, y: rooms[0].y })

                    isPressed = false
                    isDrawFinished = true

                    canvas.style.cursor = 'inherit'

                    if(valueInput.trim() !== '' && isDrawFinished) {
                    saveButton.style.cursor = 'pointer'
                    saveButton.style.backgroundColor = 'green'
                    saveButton.disabled = false
                    } else {
                    saveButton.style.cursor = 'not-allowed'
                    saveButton.style.backgroundColor = 'gray'
                    saveButton.disabled = true
                    }
                } else {
                    rooms.push({ x: mouseDownPos.x, y: mouseDownPos.y })
                }
            },
            mousemove(){
                if (!isPressed) return 
                const { clientX, clientY } = window.event as MouseEvent

                let currentPos = {
                    x: clientX - canvas.offsetLeft,
                    y: clientY - canvas.offsetTop
                }

                let line = { start: mouseDownPos, end: currentPos }
                
                context.clearRect(0, 0, canvas.width, canvas.height)

                drawLine(context, line)
            }
        }

        Object.keys(mouseEvents).forEach(eventName => {
            canvas.addEventListener( eventName, mouseEvents[eventName as keyof Events])
        })

        // * ------------------------- Buttons ------------------------- *
        createButton.addEventListener('click', () => {
            isModeDrawing = true

            idInput.style.display = 'inline-block'
            idInput.focus()
            createButton.style.cursor = 'not-allowed'
            createButton.disabled = true
            saveButton.style.display = 'inline-block'
            saveButton.style.cursor = 'not-allowed'
            saveButton.style.backgroundColor = 'gray'
            saveButton.disabled = true
            cancelButton.style.display = 'inline-block'
            cancelButton.style.cursor = 'pointer'
            cancelButton.style.marginLeft = '5px'
        })

        idInput.addEventListener('input', event => {
            targetInput = event.target as HTMLTextAreaElement
            valueInput = targetInput.value

            if(valueInput.trim() !== '' && isDrawFinished) {
            saveButton.style.cursor = 'pointer'
            saveButton.style.backgroundColor = 'green'
            saveButton.disabled = false
            } else {
            saveButton.style.cursor = 'not-allowed'
            saveButton.style.backgroundColor = 'gray'
            saveButton.disabled = true
            }
        })

        saveButton.addEventListener('click', () => {
            if(valueInput.trim() !== '' && isDrawFinished) {
            // Send roomsAPI to the server
            roomsRendered[valueInput] = {
                positions: rooms
            }

            // If true execute
            context.clearRect(0, 0, canvas.width, canvas.height)

            isPressed = false
            isDrawFinished = false
            isModeDrawing = false

            circle = new Path2D()
            rooms = []
            if (targetInput) {
                targetInput.value = ''
            }
            valueInput = ''

            createButton.style.cursor = 'pointer'
            createButton.disabled = false
            idInput.style.display = 'none'
            saveButton.style.display = 'none'
            cancelButton.style.display = 'none'
            }
        })

        cancelButton.addEventListener('click', () => {
            context.clearRect(0, 0, canvas.width, canvas.height)

            isPressed = false
            isDrawFinished = false
            isModeDrawing = false

            circle = new Path2D()
            rooms = []
            if (targetInput) {
            targetInput.value = ''
            }
            valueInput = ''

            createButton.style.cursor = 'pointer'
            createButton.disabled = false
            idInput.style.display = 'none'
            saveButton.style.display = 'none'
            cancelButton.style.display = 'none'
        })

        function render(): void {
            createRoom()

            requestAnimationFrame(render)
        }

        render()
    }, [roomsRendered])

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <canvas id='canvas' width={400} height={400} className={styles.map}></canvas>

      <div style={{ marginLeft: 5 }}>
        <div>
          <button id='createButton'>Create new room</button>
        </div>

        <input type='text' id='idInput' />

        <div>
          <button id='saveButton'>Save</button>
          <button id='cancelButton'>Cancel</button>
        </div>
      </div>
    </div>
  )
}
