'use client'

import React, {useCallback, useEffect, useRef} from 'react'
import ReactCanvasConfetti from 'react-canvas-confetti'

function randomInRange(min, max) {
    return Math.random() * (max - min) + min
}

const canvasStyles = {
    position: 'fixed',
    pointerEvents: 'none',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
}

function getAnimationSettings(originXA, originXB, particleCount) {
    return {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 0,
        particleCount: particleCount,
        origin: {
            x: randomInRange(originXA, originXB),
            y: Math.random() - 0.2,
        },
    }
}

export default function Confetti() {
    const refAnimationInstance = useRef(null)
    const getInstance = useCallback((instance) => {
        refAnimationInstance.current = instance
    }, [])

    const nextTickAnimation = useCallback((particleCount = 150) => {
        if (refAnimationInstance.current) {
            refAnimationInstance.current(getAnimationSettings(0.1, 0.3, particleCount))
            refAnimationInstance.current(getAnimationSettings(0.7, 0.9, particleCount))
        }
    }, [])

    useEffect(() => {
        let particleCount = 150
        const intervalId = setInterval(() => {
            nextTickAnimation(particleCount)
            if (particleCount > 0) {
                particleCount -= 10
            }
        }, 400)
        setTimeout(() => {
            clearInterval(intervalId)
        }, 1400)
        return () => {
            clearInterval(intervalId)
            if (refAnimationInstance.current) {
                refAnimationInstance.current.reset()
            }
        }
    }, [nextTickAnimation])

    return <ReactCanvasConfetti refConfetti={getInstance} style={canvasStyles}/>
}