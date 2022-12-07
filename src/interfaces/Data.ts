type Players = {
  [playerId: string]: {
    x: number
    y: number
    color: string
    drawColor: string
    borderColor: string
    borderColorSelected: string
  }
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
  translate: {
    x: number
    y: number
  }
}

type PlayerAPI = {
  id: string
  position: {
    x: number
    y: number
  }
}

type Mode = 'createRoom' | 'normal'

type Rooms = {
  [roomId: string]: {
    positions: { 
        x: number, 
        y: number 
    }[]
  }
}

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

export type { Players, MouseEventProps, CreateMapArgs, PlayerAPI, Mode, Rooms, MouseDownPos, Line }
