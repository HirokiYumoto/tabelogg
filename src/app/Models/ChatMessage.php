<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChatMessage extends Model
{
    const UPDATED_AT = null;

    protected $fillable = [
        'chat_room_id',
        'sender_id',
        'type',
        'body',
        'is_read',
    ];

    protected $casts = [
        'is_read' => 'boolean',
    ];

    public function chatRoom(): BelongsTo
    {
        return $this->belongsTo(ChatRoom::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(ChatMessageImage::class);
    }

    public function deletions(): HasMany
    {
        return $this->hasMany(ChatMessageDeletion::class);
    }
}
