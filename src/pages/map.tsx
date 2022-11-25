import { useEffect } from "react"

type ShapeData = {
  name: string
  color: string
  drawColor: string
  points: {
    x: number
    y: number
  }
}

let player1 = {
  name: "Tiago",
  color: "#7986cb",
  drawColor: "#7986cb",
  points: { x: 350, y: 200 },
}

let player2 = {
  name: "Leh",
  color: "#7986cb",
  drawColor: "#7986cb",
  points: { x: 650, y: 200 },
}

export default function Map() {
  useEffect(() => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement
    const context = canvas.getContext("2d") as CanvasRenderingContext2D
    const canvasWidth = canvas.width
    const canvasHeight = canvas.height
    const bodyToShape = 120

    let [mouseX, mouseY] = [0, 0]
    let shapes: ShapeData[] = []
    shapes.push(player1, player2)

    function reOffset() {
      const BB = canvas.getBoundingClientRect()
      mouseX = BB.left
      mouseY = BB.top
    }

    window.onscroll = function (e) { reOffset()}
    window.onresize = function (e) { reOffset()}

    reOffset()

    canvas.addEventListener("mousemove", event => {
      event.preventDefault()
      event.stopPropagation()

      mouseX = event.clientX
      mouseY = event.clientY

      context.clearRect(0, 0, canvasHeight, canvasWidth)

      canvas.style.cursor = 'inherit'

      for (let index = 0; index < shapes.length; index++) {
        const shape = shapes[index]

        defineShape(shape.points)

        if (context.isPointInPath(mouseX, mouseY)) {
          canvas.style.cursor = 'pointer'
          shape.drawColor = '#9fa8da'
        }
         else {
          shape.drawColor = shape.color
        }
      }

      drawAll()
    })

    function defineShape(points: { x: number, y: number }) {
      context.beginPath()
      context.arc(points.x, points.y, bodyToShape, 0, 2 * Math.PI)
      context.closePath()
    }

    function drawAll() {
      for (let index = 0; index < shapes.length; index++) {
        const shape = shapes[index]

        defineShape(shape.points)
        context.fillStyle = shape.drawColor
        context.fill()
        context.stroke()

        // Text
        context.fillStyle = "#FFF"
        context.textAlign = 'center'
        context.font = "14px verdana"
        context.fillText(
          shape.name,
          shape.points.x,
          shape.points.y + bodyToShape + 20
        )

        if (shape.color !== shape.drawColor) {
          context.textAlign = 'right'
          context.fillText(
            'ID: ' + shape.name,
            shape.points.x,
            shape.points.y + bodyToShape + 40
          )
          context.fillText(
            'x: ' + shape.points.x,
            shape.points.x,
            shape.points.y + bodyToShape + 60
          )
          context.fillText(
            'y: ' + shape.points.y,
            shape.points.x,
            shape.points.y + bodyToShape + 80
          )
        }
      }
    }

    drawAll()
  }, [])

  return (
    <canvas 
      id="canvas" 
      width={900} 
      height={900}
      style={{
        backgroundColor: '#000'
      }}
    ></canvas>
  )    
}
