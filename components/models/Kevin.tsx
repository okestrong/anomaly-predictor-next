import React from 'react'
import { useGLTF } from '@react-three/drei'

export function Kevin(props: any) {
  const { nodes } = useGLTF('/3d/models/kevin.glb')
  return (
    <group {...props} dispose={null}>
      <mesh geometry={(nodes.geometry_0 as any).geometry} material={(nodes.geometry_0 as any).material} />
    </group>
  )
}

useGLTF.preload('/3d/models/kevin.glb')
