import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";

const easeOutPower2 = (t: number) => 1 - Math.pow(1 - t, 2);
const easeInPower2 = (t: number) => t * t;

type cubeProps = {
    className: string;
}

export default function Scene({ className }: cubeProps) {
    const mountRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!mountRef.current) return;

        const backgroundColor = 0x222831;

        /* ---------------- SCENE ---------------- */
        const scene = new THREE.Scene();


        const frustumSize = 3;
        let aspect = window.innerWidth / window.innerHeight;

        const camera = new THREE.OrthographicCamera(
            (-frustumSize * aspect) / 2,
            (frustumSize * aspect) / 2,
            frustumSize / 2,
            -frustumSize / 2,
            1,
            2000
        );

        camera.position.set(10, 10, 10);
        camera.lookAt(0, 0, 0);
        scene.add(camera);

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);
        mountRef.current.appendChild(renderer.domElement);

        /* ---------------- RESIZE ---------------- */
        const onResize = () => {
            const aspect = window.innerWidth / window.innerHeight;

            camera.left = (-frustumSize * aspect) / 2;
            camera.right = (frustumSize * aspect) / 2;
            camera.top = frustumSize / 2;
            camera.bottom = -frustumSize / 2;

            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener("resize", onResize);

        /* ---------------- ALPHA MAP ---------------- */
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = canvas.height = 128;

        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, 128, 128);
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = "#000";
        ctx.fillRect(1, 1, 126, 126);

        const tex = new THREE.TextureLoader().load(canvas.toDataURL());
        tex.magFilter = THREE.NearestFilter;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.anisotropy = 2;

        /* ---------------- CUBE ---------------- */
        const geo = new THREE.BoxGeometry(1, 1, 1);

        const mat = new THREE.MeshBasicMaterial({
            transparent: true,
            alphaMap: tex,
            opacity: 0.95,
            depthTest: false,
            depthWrite: false,
            side: THREE.DoubleSide,
        });

        const baseCube = new THREE.Mesh(geo, mat);

        baseCube.material.color.set("#fffd01");
        baseCube.material.color.offsetHSL(0.9, 0.72, 0.2);

        const cubes = new THREE.Group();

        const TOTAL = 8;

        for (let i = 0; i < TOTAL; i++) {
            const clone = baseCube.clone();
            clone.material = clone.material.clone();

            clone.material.color.offsetHSL(
                0.15 * (i / TOTAL),
                0,
                0.15 * (i / TOTAL)
            );

            clone.scale.set(
                1 - 0.9 * (i / TOTAL),
                1,
                1 - 0.9 * (i / TOTAL)
            );

            cubes.add(clone);
        }

        scene.add(cubes);
        cubes.position.set(2.25, 1, 0);
        /* ---------------- GSAP TIMELINE (FIXED) ---------------- */
        const tl = gsap.timeline({
            repeat: -1,
            delay: 0.9,
            repeatDelay: 0.2,
            yoyo: true,
        });

        tl.timeScale(0.8);

        cubes.children.forEach((cube: any, i, arr) => {
            const t = i / arr.length;

            tl.addLabel("cube" + i, 0.75 * easeOutPower2(1 - t));

            tl.to(
                cube.rotation,
                {
                    duration: 5,
                    z: Math.PI * 2,
                    x: Math.PI * -2,
                    ease: "expo.inOut",
                },
                "cube" + i
            );

            tl.to(
                cube.scale,
                {
                    duration: 1.25,
                    y: 1 - 0.9 * t,
                    ease: "expo.inOut",
                },
                "cube" + i
            );

            tl.to(
                cube.scale,
                {
                    duration: 1.25,
                    y: 1,
                    ease: "expo.inOut",
                },
                3 + 0.75 * easeInPower2(t)
            );
        });

        /* ---------------- TEXTURE ANIMATION ---------------- */
        tl.to(
            tex.offset,
            {
                duration: 1.25,
                x: 1,
                y: 1,
                ease: "power2.in",
            },
            2.25
        );

        /* ---------------- GROUP ROTATION ---------------- */
        tl.to(
            cubes.rotation,
            {
                duration: 5.75,
                x: Math.PI * 2,
                z: Math.PI * -2,
                ease: "expo.inOut",
            },
            0.25
        );

        /* ---------------- RENDER LOOP ---------------- */
        const animate = () => {
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        };

        animate();

        /* ---------------- CLEANUP ---------------- */
        return () => {
            window.removeEventListener("resize", onResize);
            mountRef.current?.removeChild(renderer.domElement);
            renderer.dispose();
        };
    }, []);

    return <div className={className} ref={mountRef} />;
}