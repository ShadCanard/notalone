import { Card, Textarea, Button, Group, Select, Switch, Stack, FileButton, Image, CloseButton, ActionIcon, Badge } from '@mantine/core';
import { IconMicrophone } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useCreatePost, useUploadAttachments } from '@/hooks/useApi';
import { notifications } from '@mantine/notifications';
import { useEffect, useRef, useState } from 'react';
import OGPreviewCreatePostComponent, { OgPreviewData } from '@/components/posts/OGPreviewCreatePostComponent';

const moodOptions = [
  { value: 'happy', label: '😊 Content(e)' },
  { value: 'grateful', label: '🙏 Reconnaissant(e)' },
  { value: 'hopeful', label: '🌟 Plein(e) d\'espoir' },
  { value: 'calm', label: '😌 Apaisé(e)' },
  { value: 'loved', label: '🥰 Aimé(e)' },
  { value: 'strong', label: '💪 Fort(e)' },
  { value: 'anxious', label: '😰 Anxieux(se)' },
  { value: 'sad', label: '😢 Triste' },
  { value: 'lonely', label: '🫂 Seul(e)' },
  { value: 'struggling', label: '🌧️ En difficulté' },
];

interface CreatePostFormValues {
  content: string;
  mood: string;
  isPublic: boolean;
  files: File[];
}

export default function CreatePostForm() {
  const createPost = useCreatePost();
  const uploadAttachments = useUploadAttachments();

  const form = useForm<CreatePostFormValues>({
    initialValues: {
      content: '',
      mood: '',
      isPublic: true,
      files: [],
    },
    validate: {
      content: (value) => (value.trim().length < 1 ? 'Écris quelque chose...' : null),
    },
  });

  const [previews, setPreviews] = useState<Array<{ url: string; name: string; type: string }>>([]);
  const [linkPreview, setLinkPreview] = useState<OgPreviewData | null>(null);
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
  const [hiddenPreviewUrl, setHiddenPreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // create object URLs for previews
    const files = form.values.files || [];
    // revoke old
    setPreviews((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return [];
    });
    const next = files.map((f) => ({ url: URL.createObjectURL(f), name: f.name, type: f.type }));
    setPreviews(next);
    return () => {
      next.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [form.values.files]);

  const contentInputProps = form.getInputProps('content');

  const detectUrl = (content: string) => {
    const match = content.match(/https?:\/\/[^\s]+/i);
    return match?.[0] ?? null;
  };

  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = event.currentTarget.value;
    contentInputProps.onChange(event);
    const url = detectUrl(content);
    console.log('[CreatePostForm] detect url content', content);
    console.log('[CreatePostForm] detected url', url);
    if (!url) {
      setDetectedUrl(null);
      setLinkPreview(null);
      return;
    }
    if (url === detectedUrl) return;
    setDetectedUrl(url);
  };

  // handle microphone recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef ? chunksRef.current : [], { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
        const prev = form.values.files || [];
        form.setFieldValue('files', [...prev, file]);
        setIsRecording(false);
        // release stream tracks
        if (mediaStreamRef && mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
      };
      mr.start();
      setIsRecording(true);
    } catch (_err) {
      void _err;
      notifications.show({ title: 'Micro inaccessible', message: 'Autorise l\'accès au micro dans ton navigateur.', color: 'red' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleSubmit = form.onSubmit(async (values) => {
    try {
      let attachmentIds: string[] | undefined = undefined;
      let payload: Record<string, unknown> | undefined = undefined;
      if (values.files && values.files.length > 0) {
        try {
          const res = await uploadAttachments.mutateAsync(values.files);
          const attachments = res?.attachments || [];
          const valid = attachments.filter((a) => a && a.id);
          if (valid.length !== attachments.length) {
            notifications.show({ title: 'Upload partiel', message: 'Certaines pièces jointes n\'ont pas été acceptées.', color: 'yellow' });
          }
          attachmentIds = valid.map((a) => a.id);
          if (valid.length > 0) {
            payload = { attachments: valid };
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Échec de l\'upload des fichiers';
          notifications.show({ title: 'Erreur upload', message, color: 'red' });
          return;
        }
      }

      if (linkPreview?.url) {
        payload = {
          ...(payload ?? {}),
          linkedUrl: linkPreview.url,
          linkedTitle: linkPreview.title,
          linkedDescription: linkPreview.description,
          linkedImage: linkPreview.image,
          linkedSiteName: linkPreview.siteName,
        };
      }

      const isOnlyUrl = linkPreview?.url && values.content.trim() === linkPreview.url;
      const contentToSend = isOnlyUrl ? '' : values.content;

      await createPost.mutateAsync({ content: contentToSend, mood: values.mood || undefined, isPublic: values.isPublic, attachmentIds, payload });
      setLinkPreview(null);
      setDetectedUrl(null);
      setHiddenPreviewUrl(null);
      form.reset();
      notifications.show({ title: 'Post publié !', message: 'Merci de partager avec la communauté 💙', color: 'green' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Impossible de publier le post. Réessaie.';
      notifications.show({ title: 'Erreur', message: msg, color: 'red' });
    }
  });

  return (
    <Card shadow="sm" padding="lg" radius="lg" withBorder style={{ borderColor: '#EAF7FF' }}>
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
            {previews.length > 0 && (
              <Group gap="md" style={{ marginBottom: 8 }}>
                {previews.map((p, idx) => (
                  <Card key={p.url} shadow="sm" padding="xs" radius="md" style={{ width: 160, position: 'relative' }}>
                    <CloseButton size="sm" style={{ position: 'absolute', right: 6, top: 6 }} onClick={() => {
                      const prev = form.values.files || [];
                      const next = prev.filter((_, i) => i !== idx);
                      form.setFieldValue('files', next);
                      setPreviews((pv) => pv.filter((_, i) => i !== idx));
                    }} />
                    {p.type.startsWith('image/') ? (
                      <Image src={p.url} alt={p.name} width={150} height={100} fit="cover" />
                    ) : p.type.startsWith('audio/') ? (
                      <audio controls src={p.url} style={{ width: '100%' }} />
                    ) : (
                      <a href={p.url} target="_blank" rel="noreferrer">{p.name}</a>
                    )}
                  </Card>
                ))}
              </Group>
            )}
          <Textarea
            placeholder="Comment te sens-tu aujourd'hui ? Partage tes pensées, tes victoires, ou ce qui te pèse... Tu n'es pas seul(e) 🧡"
            autosize
            minRows={3}
            maxRows={8}
            {...contentInputProps}
            onChange={handleContentChange}
          />

          <OGPreviewCreatePostComponent
            url={detectedUrl}
            hiddenUrl={hiddenPreviewUrl}
            onPreviewChange={setLinkPreview}
            onClose={() => {
              setHiddenPreviewUrl(detectedUrl);
              setLinkPreview(null);
            }}
          />

          <Group justify="space-between" align="flex-end">
            <Group>
              <Select
                placeholder="Ton humeur"
                data={moodOptions}
                clearable
                styles={{ input: { width: 200 } }}
                {...form.getInputProps('mood')}
              />
              <Switch
                label="Public"
                color="pastelBlue"
                {...form.getInputProps('isPublic', { type: 'checkbox' })}
              />
              <FileButton
                onChange={(file) => {
                  if (!file) return;
                  // support multiple files by appending
                  const prev = form.values.files || [];
                  form.setFieldValue('files', [...prev, file]);
                }}
                accept="image/*,audio/*"
              >
                {(props) => <Button {...props}>Ajouter fichier</Button>}
              </FileButton>
              <ActionIcon
                variant="filled"
                color={isRecording ? 'red' : 'gray'}
                onClick={() => (isRecording ? stopRecording() : startRecording())}
                title={isRecording ? 'Arrêter l\'enregistrement' : 'Enregistrer un message vocal'}
                style={{ marginLeft: 8 }}
              >
                <IconMicrophone />
              </ActionIcon>
              {isRecording && <Badge color="red" variant="dot" ml={8}>Enregistrement...</Badge>}
              {/* filenames are shown as previews above textarea; no inline list */}
            </Group>

            <Button type="submit" color="pastelBlue" loading={createPost.isPending || uploadAttachments.isPending}>
              Partager
            </Button>
          </Group>
        </Stack>
      </form>
    </Card>
  );
}
