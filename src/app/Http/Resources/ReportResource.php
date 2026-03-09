<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reporter' => $this->whenLoaded('reporter', fn() => $this->reporter ? [
                'id' => $this->reporter->id,
                'name' => $this->reporter->name,
            ] : null),
            'target_user' => $this->whenLoaded('targetUser', fn() => $this->targetUser ? [
                'id' => $this->targetUser->id,
                'name' => $this->targetUser->name,
            ] : null),
            'reason' => $this->reason,
            'status' => $this->status,
            'admin_note' => $this->admin_note,
            'resolver' => $this->whenLoaded('resolver', fn() => $this->resolver ? [
                'id' => $this->resolver->id,
                'name' => $this->resolver->name,
            ] : null),
            'actions' => $this->whenLoaded('actions', fn() => $this->actions->map(fn($action) => [
                'id' => $action->id,
                'admin' => $action->admin ? [
                    'id' => $action->admin->id,
                    'name' => $action->admin->name,
                ] : null,
                'action' => $action->action,
                'note' => $action->note,
                'created_at' => $action->created_at?->toISOString(),
            ])),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
