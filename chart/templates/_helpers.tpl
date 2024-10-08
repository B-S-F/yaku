{{/*
Expand the name of the chart.
*/}}
{{- define "yaku.name" -}}
{{- default "yaku" .Values.global.fullName | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "yaku.fullname" -}}
{{- $name := default "bsf-yaku" .Values.global.fullName }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}


{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "yaku.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "yaku.labels" -}}
helm.sh/ParentChart: {{ include "yaku.name" . }}
helm.sh/chart: {{ include "yaku.chart" . }}
{{ include "yaku.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "yaku.selectorLabels" -}}
app.kubernetes.io/name: {{ include "yaku.fullname" . }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "yaku.serviceAccountName" -}}
{{- if .Values.global.serviceAccount.create }}
{{- default (include "yaku.fullname" .) .Values.global.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.global.serviceAccount.name }}
{{- end }}
{{- end }}
