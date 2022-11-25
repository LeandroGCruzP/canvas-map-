import { useEffect } from "react"

type ShapeData = {
  name: string
  color: string
  drawColor: string
  points: {
    x: number
    y: number
  }[]
}

let triangle1 = {
  name: "Tiago",
  color: "#7986cb",
  drawColor: "#7986cb",
  points: [
    { x: 300, y: 150 },
    { x: 400, y: 150 },
    { x: 400, y: 250 },
    { x: 300, y: 250 }, // 350 x 200
  ],
}

let triangle2 = {
  name: "Leh",
  color: "#7986cb",
  drawColor: "#7986cb",
  points: [
    { x: 600, y: 150 },
    { x: 700, y: 150 },
    { x: 700, y: 250 },
    { x: 600, y: 250 }, // 650 x 200
  ],
}

export default function Map() {
  useEffect(() => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement
    const context = canvas.getContext("2d") as CanvasRenderingContext2D
    const canvasWidth = canvas.width
    const canvasHeight = canvas.height

    let [mouseX, mouseY] = [0, 0]
    let shapes: ShapeData[] = []
    shapes.push(triangle1, triangle2)

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

    function defineShape(points: { x: number, y: number }[]) {
      context.beginPath()
      context.moveTo(points[0].x, points[0].y)

      for (let index = 1; index < points.length; index++) {
        context.lineTo(points[index].x, points[index].y)
      }

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
          (shape.points[3].x + shape.points[2].x) / 2,
          shape.points[3].y + 15
        )

        if (shape.color !== shape.drawColor) {
          context.textAlign = 'right'
          context.fillText(
            'ID: ' + shape.name,
            (shape.points[3].x + shape.points[2].x) / 2,
            shape.points[3].y + 35
          )
          context.fillText(
            'x: ' + shape.points[0].x,
            (shape.points[3].x + shape.points[2].x) / 2,
            shape.points[3].y + 55
          )
          context.fillText(
            'y: ' + shape.points[0].y,
            (shape.points[3].x + shape.points[2].x) / 2,
            shape.points[3].y + 75
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
