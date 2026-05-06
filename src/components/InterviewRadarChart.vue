<template>
  <div class="radar-card">
    <svg :viewBox="`0 0 ${size} ${size}`" class="radar-svg" aria-hidden="true">
      <g :transform="`translate(${center}, ${center})`">
        <polygon
          v-for="level in levels"
          :key="level"
          :points="polygonPoints((radius / levels) * level)"
          class="radar-grid"
        />
        <line
          v-for="(item, index) in metrics"
          :key="`${item.name}-${index}`"
          :x1="0"
          :y1="0"
          :x2="pointAt(index, radius).x"
          :y2="pointAt(index, radius).y"
          class="radar-axis"
        />
        <polygon :points="metricPolygon" class="radar-area" />
        <circle
          v-for="(item, index) in metrics"
          :key="`dot-${item.name}-${index}`"
          :cx="pointAt(index, radius * normalizeScore(item.score)).x"
          :cy="pointAt(index, radius * normalizeScore(item.score)).y"
          class="radar-dot"
          r="4"
        />
      </g>
      <g>
        <text
          v-for="(item, index) in metrics"
          :key="`label-${item.name}-${index}`"
          :x="labelPosition(index).x"
          :y="labelPosition(index).y"
          class="radar-label"
          text-anchor="middle"
        >
          {{ item.name }}
        </text>
      </g>
    </svg>
  </div>
</template>

<script>
export default {
  name: 'InterviewRadarChart',
  props: {
    metrics: {
      type: Array,
      default: () => []
    },
    size: {
      type: Number,
      default: 250
    },
    maxScore: {
      type: Number,
      default: 10
    }
  },
  computed: {
    safeMetrics() {
      return this.metrics.length
        ? this.metrics
        : [
            { name: '准确性', score: 0 },
            { name: '完整性', score: 0 },
            { name: '表达能力', score: 0 },
            { name: '逻辑能力', score: 0 },
            { name: '详细程度', score: 0 }
          ];
    },
    center() {
      return this.size / 2;
    },
    radius() {
      return this.size * 0.22;
    },
    levels() {
      return 5;
    },
    metricsList() {
      return this.safeMetrics.slice(0, 5);
    },
    metricPolygon() {
      return this.metricsList
        .map((item, index) => {
          const point = this.pointAt(index, this.radius * this.normalizeScore(item.score));
          return `${point.x},${point.y}`;
        })
        .join(' ');
    }
  },
  methods: {
    normalizeScore(score) {
      const numeric = Number(score) || 0;
      return Math.max(0, Math.min(numeric / this.maxScore, 1));
    },
    angleAt(index) {
      return (-Math.PI / 2) + (Math.PI * 2 * index) / this.metricsList.length;
    },
    pointAt(index, currentRadius) {
      const angle = this.angleAt(index);
      return {
        x: Math.cos(angle) * currentRadius,
        y: Math.sin(angle) * currentRadius
      };
    },
    polygonPoints(currentRadius) {
      return this.metricsList
        .map((item, index) => {
          const point = this.pointAt(index, currentRadius);
          return `${point.x},${point.y}`;
        })
        .join(' ');
    },
    labelPosition(index) {
      const point = this.pointAt(index, this.radius + 28);
      return {
        x: point.x + this.center,
        y: point.y + this.center + 6
      };
    }
  }
};
</script>

<style scoped>
.radar-card {
  width: 100%;
}

.radar-svg {
  display: block;
  width: 100%;
  height: auto;
}

.radar-grid {
  fill: none;
  stroke: rgba(118, 139, 170, 0.2);
  stroke-width: 1;
}

.radar-axis {
  stroke: rgba(118, 139, 170, 0.22);
  stroke-width: 1;
}

.radar-area {
  fill: rgba(42, 181, 116, 0.18);
  stroke: #2ab574;
  stroke-width: 2;
}

.radar-dot {
  fill: #2ab574;
}

.radar-label {
  fill: #4b596f;
  font-size: 10px;
  font-weight: 600;
}
</style>
