<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatRoomDeletion extends Model
{
    const UPDATED_AT = null;

    protected $fillable = ['chat_room_id', 'user_id', 'deleted_at'];

    protected $casts = [
        'deleted_at' => 'datetime',
    ];

    public function chatRoom(): BelongsTo
    {
        return $this->belongsTo(ChatRoom::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
