<script lang="ts">
	import { useThrelte } from '@threlte/core';
	import { Color, Fog } from 'three';

	const { scene } = useThrelte();

	scene.background = new Color('#0a1122');
	scene.fog = new Fog('#0a1122', 18, 36);
</script>
