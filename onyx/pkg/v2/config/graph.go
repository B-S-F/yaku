package config

import model "github.com/B-S-F/onyx/pkg/v2/model"

type stepGraph struct {
	adjList   map[string][]string
	inDegree  map[string]int
	stepsByID map[string]model.Step
}

func newStepGraph(steps []model.Step) stepGraph {
	graph := stepGraph{
		adjList:   make(map[string][]string),
		inDegree:  make(map[string]int),
		stepsByID: make(map[string]model.Step),
	}

	for _, s := range steps {
		graph.stepsByID[s.ID] = s

		if _, exists := graph.inDegree[s.ID]; !exists {
			graph.inDegree[s.ID] = 0
		}

		for _, dep := range s.Depends {
			graph.adjList[dep] = append(graph.adjList[dep], s.ID)
			graph.inDegree[s.ID]++
		}
		if _, exists := graph.adjList[s.ID]; !exists {
			graph.adjList[s.ID] = []string{}
		}
	}

	return graph
}

func (g *stepGraph) hasCycle() bool {
	visited := make(map[string]bool)
	stack := make(map[string]bool)

	for node := range g.adjList {
		if !visited[node] {
			if g.isCyclicSubgraph(node, visited, stack) {
				return true
			}
		}
	}

	return false
}

func (g *stepGraph) isCyclicSubgraph(node string, visited map[string]bool, stack map[string]bool) bool {
	visited[node] = true
	stack[node] = true

	for _, neighbor := range g.adjList[node] {
		if !visited[neighbor] {
			if g.isCyclicSubgraph(neighbor, visited, stack) {
				return true
			}
		} else if stack[neighbor] {
			// If the neighbor is in the recursion stack, there is a cycle
			return true
		}
	}

	stack[node] = false
	return false
}

func (g *stepGraph) topologicalSort() [][]model.Step {
	var result [][]model.Step
	var queue []model.Step

	// init queue with nodes having in-degree=0
	for stepID, degree := range g.inDegree {
		if degree == 0 {
			queue = append(queue, g.stepsByID[stepID])
		}
	}

	for len(queue) > 0 {
		var level []model.Step
		var nextQueue []model.Step

		for _, step := range queue {
			level = append(level, step)
			for _, neighborID := range g.adjList[step.ID] {
				g.inDegree[neighborID]--
				if g.inDegree[neighborID] == 0 {
					nextQueue = append(nextQueue, g.stepsByID[neighborID])
				}
			}
		}

		result = append(result, level)
		queue = nextQueue
	}

	return result
}
