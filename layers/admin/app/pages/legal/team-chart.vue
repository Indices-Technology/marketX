<template>
  <main class="min-h-[560px] bg-slate-50 px-4 py-6 text-slate-800">
    <section class="mx-auto flex w-full max-w-6xl flex-col items-center">
      <div
        class="mb-6 flex w-full max-w-4xl flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5"
      >
        <div class="flex flex-wrap gap-2">
          <button
            v-for="filter in filters"
            :key="filter.value"
            type="button"
            class="rounded-md px-3.5 py-2 text-[13px] font-medium transition-colors"
            :class="
              activeFilter === filter.value
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-blue-600 hover:text-white'
            "
            @click="selectFilter(filter.value)"
          >
            {{ filter.label }}
          </button>
        </div>

        <label class="relative block w-full sm:w-56">
          <Icon
            name="solar:magnifer-linear"
            size="16"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            v-model="search"
            type="search"
            class="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-blue-600"
            placeholder="Search team member..."
            @input="activeFilter = 'all'"
          />
        </label>
      </div>

      <div class="chart-container w-full overflow-x-auto pb-5">
        <div class="tree-row">
          <div class="exec-wrapper">
            <TeamMemberCard
              v-for="member in executiveMembers"
              :key="member.name"
              :member="member"
              :state="memberState(member)"
            />
          </div>
        </div>

        <div class="tree-row">
          <div class="branches">
            <div v-for="branch in branches" :key="branch.id" class="branch-col">
              <TeamMemberCard
                v-for="member in branch.leads"
                :key="member.name"
                :member="member"
                :state="memberState(member)"
              />

              <div v-if="branch.support.length" class="sub-group">
                <TeamMemberCard
                  v-for="member in branch.support"
                  :key="member.name"
                  :member="member"
                  :state="memberState(member)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, type PropType, ref } from 'vue'

type TeamFilter = 'all' | 'engineering' | 'ops' | 'growth'
type MemberState = 'default' | 'highlight' | 'fade'

interface TeamMember {
  name: string
  role: string
  team: TeamFilter
  variant?: 'ceo' | 'advisor'
  tag?: {
    label: string
    tone: 'conditional' | 'external' | 'probation' | 'fellow'
  }
}

interface TeamBranch {
  id: Exclude<TeamFilter, 'all'>
  leads: TeamMember[]
  support: TeamMember[]
}

const TeamMemberCard = defineComponent({
  props: {
    member: {
      type: Object as PropType<TeamMember>,
      required: true,
    },
    state: {
      type: String as PropType<MemberState>,
      default: 'default',
    },
  },
  setup(props) {
    const cardClass = computed(() => [
      'member-card',
      props.member.variant === 'ceo' && 'member-card--ceo',
      props.member.variant === 'advisor' && 'member-card--advisor',
      props.state === 'highlight' && 'member-card--highlight',
      props.state === 'fade' && 'member-card--fade',
    ])

    const tagClass = computed(() => [
      'member-tag',
      props.member.tag && `member-tag--${props.member.tag.tone}`,
    ])

    return () =>
      h('article', { class: cardClass.value }, [
        h('h2', { class: 'member-name' }, props.member.name),
        h('p', { class: 'member-role' }, props.member.role),
        props.member.tag
          ? h('span', { class: tagClass.value }, props.member.tag.label)
          : null,
      ])
  },
})

useHead({
  title: 'MarketX Team Chart',
})

const filters: Array<{ label: string; value: TeamFilter }> = [
  { label: 'All Teams', value: 'all' },
  { label: 'Engineering', value: 'engineering' },
  { label: 'Ops & Admin', value: 'ops' },
  { label: 'Growth & Media', value: 'growth' },
]

const activeFilter = ref<TeamFilter>('all')
const search = ref('')

const executiveMembers: TeamMember[] = [
  {
    name: 'Opeyemi Makinde',
    role: 'Strategic / Technical Advisor',
    team: 'ops',
    variant: 'advisor',
    tag: { label: 'Conditional Performance', tone: 'conditional' },
  },
  {
    name: 'Joshua Akibu',
    role: 'Founder / CEO / Product Owner',
    team: 'all',
    variant: 'ceo',
  },
  {
    name: 'Joy Akibu',
    role: 'Business Insight Advisor',
    team: 'all',
    variant: 'advisor',
    tag: { label: 'Feedback Only', tone: 'external' },
  },
]

const branches: TeamBranch[] = [
  {
    id: 'engineering',
    leads: [
      {
        name: 'Mapida Ishaya',
        role: 'Backend Developer',
        team: 'engineering',
      },
    ],
    support: [],
  },
  {
    id: 'ops',
    leads: [
      {
        name: 'Esther Abah',
        role: 'Operations / Data / Admin Support',
        team: 'ops',
      },
    ],
    support: [
      {
        name: 'Obed Malua',
        role: 'General Support / Trainee',
        team: 'ops',
        tag: { label: 'NJFP Fellow', tone: 'fellow' },
      },
      {
        name: 'Ikemdi Samuel',
        role: 'General Support / Trainee',
        team: 'ops',
        tag: { label: 'NJFP Fellow', tone: 'fellow' },
      },
    ],
  },
  {
    id: 'growth',
    leads: [
      {
        name: 'Godson Gilam',
        role: 'Media & Video Content',
        team: 'growth',
      },
      {
        name: 'Ebenezer Fakiyesi',
        role: 'Graphic Design',
        team: 'growth',
        tag: { label: 'Junior / Probation', tone: 'probation' },
      },
    ],
    support: [
      {
        name: 'Israel Eze',
        role: 'Volunteer Contributor',
        team: 'growth',
      },
      {
        name: 'Joseph & Yinka',
        role: 'Junior Support / Learning',
        team: 'growth',
      },
    ],
  },
]

const normalizedSearch = computed(() => search.value.toLowerCase().trim())

function selectFilter(filter: TeamFilter) {
  activeFilter.value = filter
  search.value = ''
}

function memberState(member: TeamMember): MemberState {
  if (normalizedSearch.value) {
    return member.name.toLowerCase().includes(normalizedSearch.value)
      ? 'highlight'
      : 'fade'
  }

  if (
    activeFilter.value === 'all' ||
    member.team === activeFilter.value ||
    member.team === 'all'
  ) {
    return 'default'
  }

  return 'fade'
}
</script>

<style scoped>
.tree-row {
  display: flex;
  justify-content: center;
  min-width: 760px;
  position: relative;
  width: 100%;
}

.exec-wrapper {
  align-items: center;
  display: flex;
  gap: 40px;
  margin-bottom: 20px;
  position: relative;
}

.exec-wrapper::after {
  background: #cbd5e1;
  bottom: -20px;
  content: '';
  height: 20px;
  left: 50%;
  position: absolute;
  width: 2px;
}

.branches {
  display: flex;
  justify-content: space-between;
  margin-top: 40px;
  max-width: 1000px;
  position: relative;
  width: 100%;
}

.branches::before {
  background: #cbd5e1;
  content: '';
  height: 2px;
  left: 16%;
  position: absolute;
  right: 16%;
  top: -20px;
}

.branch-col {
  align-items: center;
  display: flex;
  flex: 1;
  flex-direction: column;
  position: relative;
}

.branch-col::before {
  background: #cbd5e1;
  content: '';
  height: 20px;
  position: absolute;
  top: -20px;
  width: 2px;
}

.sub-group {
  align-items: center;
  border-top: 1px dashed #cbd5e1;
  display: flex;
  flex-direction: column;
  margin-top: 10px;
  padding-top: 15px;
  width: 100%;
}

.member-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgb(15 23 42 / 0.05);
  margin-bottom: 15px;
  padding: 12px 16px;
  position: relative;
  text-align: center;
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    opacity 0.2s,
    transform 0.2s;
  width: 190px;
}

.member-card--ceo {
  border-top: 4px solid #2563eb;
}

.member-card--advisor {
  background: #fefce8;
  border: 2px dashed #eab308;
}

.member-card--highlight {
  border-color: #2563eb;
  box-shadow: 0 0 12px rgb(37 99 235 / 0.2);
  transform: scale(1.05);
}

.member-card--fade {
  opacity: 0.3;
}

.member-name {
  color: #1e293b;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.35;
  margin: 0 0 4px;
}

.member-role {
  color: #64748b;
  font-size: 11px;
  line-height: 1.3;
  margin: 0;
}

.member-tag {
  border-radius: 4px;
  display: inline-block;
  font-size: 9px;
  font-weight: 700;
  margin-top: 6px;
  padding: 2px 6px;
  text-transform: uppercase;
}

.member-tag--conditional {
  background: #fef08a;
  color: #854d0e;
}

.member-tag--external {
  background: #e2e8f0;
  color: #475569;
}

.member-tag--probation {
  background: #fee2e2;
  color: #991b1b;
}

.member-tag--fellow {
  background: #dcfce7;
  color: #166534;
}

@media (max-width: 640px) {
  .chart-container {
    margin-inline: -1rem;
    padding-inline: 1rem;
  }
}
</style>
