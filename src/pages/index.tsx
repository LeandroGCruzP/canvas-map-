'use-client'

import { useEffect } from 'react'
import styles from '../styles/Home.module.css'

export default function Home() {
  useEffect(() => {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement
    const context = canvas.getContext('2d') as CanvasRenderingContext2D
    const buttonPlus = document.getElementById('plus') as HTMLButtonElement
    const buttonMinus = document.getElementById('minus') as HTMLButtonElement

    function draw(scale: number, translatePosition: { x: number, y: number }): void {
      const mapImg = new Image()
      mapImg.src = './aceno.png'
      
      mapImg.onload = () => {
        canvas.width = mapImg.width
        canvas.height = mapImg.height

        context.translate(translatePosition.x, translatePosition.y)
        context.drawImage(mapImg, 0, 0, scale, scale, 0, 0, mapImg.width, mapImg.height)
      }
    }

    const translatePosition = {
      x: canvas.width / 2,
      y: canvas.height / 2,
    }

    let scale = 2000 // TODO: Find responsive scale
    const scaleMultiplier = 0.8
    let startDragOffset= { x: 0, y: 0 }
    let mouseDown = false

    // Button event listener: zoom in and zoom out
    buttonPlus.addEventListener('click', () => {
      scale *= scaleMultiplier

      draw(scale, translatePosition)
    }, false)

    buttonMinus.addEventListener('click', () => {
      scale /= scaleMultiplier

      draw(scale, translatePosition)
    }, false)

    // TODO: Scroll event listener: zoom in and zoom out

    // Mouse event listener: dragging
    canvas.addEventListener('mousedown', (event) => {
      mouseDown = true
      startDragOffset.x = event.clientX - translatePosition.x
      startDragOffset.y = event.clientY - translatePosition.y
    })

    canvas.addEventListener('mouseup', () => {
      mouseDown = false
    })

    canvas.addEventListener('mouseover', () => {
      mouseDown = false
    })

    canvas.addEventListener('mouseout', () => {
      mouseDown = false
    
    })
    
    canvas.addEventListener('mousemove', (event) => {
      if(mouseDown) {
        translatePosition.x = event.clientX - startDragOffset.x
        translatePosition.y = event.clientY - startDragOffset.y
        draw(scale, translatePosition)
      }
    })

    draw(scale, translatePosition)
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.wrapperCanvas}>
        <canvas id='canvas' className={styles.canvas}></canvas>

        <div className={styles.commandWrapper}>
          <div className={styles.position}>
            <span>x: 1205</span>
            <span>y: 548</span>
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
