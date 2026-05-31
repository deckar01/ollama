//go:build linux

package discover

import "testing"

func TestRocmVisibleDevicesEnvSet(t *testing.T) {
	tests := []struct {
		name string
		env  map[string]string
		want bool
	}{
		{
			name: "valid hip numeric env",
			env:  map[string]string{"HIP_VISIBLE_DEVICES": "0,2"},
			want: true,
		},
		{
			name: "valid rocr env",
			env:  map[string]string{"ROCR_VISIBLE_DEVICES": "GPU-123"},
			want: true,
		},
		{
			name: "invalid hip env",
			env:  map[string]string{"HIP_VISIBLE_DEVICES": "GPU-123"},
		},
		{
			name: "invalid rocr env",
			env:  map[string]string{"ROCR_VISIBLE_DEVICES": ", ,"},
		},
		{
			name: "invalid ordinal env",
			env:  map[string]string{"GPU_DEVICE_ORDINAL": "abc"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Setenv("HIP_VISIBLE_DEVICES", "")
			t.Setenv("ROCR_VISIBLE_DEVICES", "")
			t.Setenv("GPU_DEVICE_ORDINAL", "")
			for key, value := range tt.env {
				t.Setenv(key, value)
			}
			if got := rocmVisibleDevicesEnvSet(); got != tt.want {
				t.Fatalf("rocmVisibleDevicesEnvSet() = %v, want %v", got, tt.want)
			}
		})
	}
}
