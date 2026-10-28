import { NotFoundException, ParseUUIDPipe } from '@nestjs/common';

/** Valida `:id` como UUID; IDs malformados respondem 404 com a mensagem dada. */
export const uuidOr404 = (message: string) =>
  new ParseUUIDPipe({ exceptionFactory: () => new NotFoundException(message) });
